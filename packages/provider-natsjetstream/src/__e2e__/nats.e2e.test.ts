import { describe, it, expect } from "vitest"
import { connect } from "nats"
import { NatsJetStreamClient } from "../index"

const NATS_URL = process.env.NATS_URL ?? "nats://localhost:4222"

let natsAvailable = false

try {
  const nc = await connect({ servers: NATS_URL, timeout: 2000 })
  await nc.drain()
  natsAvailable = true
} catch {
  console.warn(`⚠ NATS not available at ${NATS_URL} — skipping e2e tests`)
}

async function withStream(name: string, fn: (stream: string) => Promise<void>) {
  const nc = await connect({ servers: NATS_URL })
  const jsm = await nc.jetstreamManager()

  await jsm.streams.add({ name, subjects: [name, `${name}.>`] })

  try {
    await fn(name)
  } finally {
    try { await jsm.streams.delete(name) } catch { }
    await nc.drain()
  }
}

describe.runIf(natsAvailable)("NATS JetStream e2e", () => {
  it("should connect and disconnect", async () => {
    const client = new NatsJetStreamClient({ servers: NATS_URL })
    expect(client.connected).toBe(false)
    await client.connect()
    expect(client.connected).toBe(true)
    await client.disconnect()
    expect(client.connected).toBe(false)
  })

  it("should list streams", async () => {
    await withStream("easyqueue-e2e-list", async (stream) => {
      const client = new NatsJetStreamClient({ servers: NATS_URL })
      await client.connect()
      const queues = await client.listQueues()
      const names = queues.map((q) => q.name)
      expect(names).toContain(stream)
      await client.disconnect()
    })
  })

  it("should publish and list messages", async () => {
    await withStream("easyqueue-e2e-pub", async (stream) => {
      const client = new NatsJetStreamClient({ servers: NATS_URL })
      await client.connect()

      await client.publish({ queue: stream, payload: { hello: "world" }, headers: { source: "e2e" } })

      const messages = await client.listMessages(stream, 10)
      expect(messages.length).toBeGreaterThanOrEqual(1)
      expect(messages[0].payload).toEqual({ hello: "world" })
      expect(messages[0].headers).toEqual({ source: "e2e" })

      await client.disconnect()
    })
  })

  it("should ack a message via deleteMessage", async () => {
    await withStream("easyqueue-e2e-ack", async (stream) => {
      const client = new NatsJetStreamClient({ servers: NATS_URL })
      await client.connect()

      await client.publish({ queue: stream, payload: { n: 1 } })

      const msgs1 = await client.listMessages(stream, 10)
      expect(msgs1.length).toBeGreaterThanOrEqual(1)

      await client.deleteMessage(stream, msgs1[0].id)

      const msgs2 = await client.listMessages(stream, 10)
      const stillThere = msgs2.some((m) => m.id === msgs1[0].id)
      expect(stillThere).toBe(false)

      await client.disconnect()
    })
  })

  it("should nak a message via releaseMessage", async () => {
    await withStream("easyqueue-e2e-nak", async (stream) => {
      const client = new NatsJetStreamClient({ servers: NATS_URL })
      await client.connect()

      await client.publish({ queue: stream, payload: { n: 2 } })

      const msgs1 = await client.listMessages(stream, 10)
      expect(msgs1.length).toBeGreaterThanOrEqual(1)

      await client.releaseMessage(stream, msgs1[0].id)

      const msgs2 = await client.listMessages(stream, 10)
      const reappeared = msgs2.find((m) => m.id === msgs1[0].id)
      expect(reappeared).toBeDefined()

      await client.disconnect()
    })
  })

  it("should ack all via purgeQueue", async () => {
    await withStream("easyqueue-e2e-purge", async (stream) => {
      const client = new NatsJetStreamClient({ servers: NATS_URL })
      await client.connect()

      await client.publish({ queue: stream, payload: { n: 3 } })
      await client.publish({ queue: stream, payload: { n: 4 } })

      const msgs1 = await client.listMessages(stream, 10)
      expect(msgs1.length).toBeGreaterThanOrEqual(2)

      await client.purgeQueue(stream)

      const msgs2 = await client.listMessages(stream, 10)
      expect(msgs2.length).toBe(0)

      await client.disconnect()
    })
  })

  it("should nak all via releaseQueue", async () => {
    await withStream("easyqueue-e2e-rlq", async (stream) => {
      const client = new NatsJetStreamClient({ servers: NATS_URL })
      await client.connect()

      await client.publish({ queue: stream, payload: { n: 5 } })
      await client.publish({ queue: stream, payload: { n: 6 } })
      await client.publish({ queue: stream, payload: { n: 7 } })

      const msgs1 = await client.listMessages(stream, 10)
      expect(msgs1.length).toBeGreaterThanOrEqual(3)
      const ids1 = msgs1.map((m) => m.id)

      await client.releaseQueue(stream)

      const msgs2 = await client.listMessages(stream, 10)
      const ids2 = new Set(msgs2.map((m) => m.id))
      for (const id of ids1) {
        expect(ids2.has(id)).toBe(true)
      }

      await client.disconnect()
    })
  })

  it("should handle messages published by an external producer", async () => {
    await withStream("easyqueue-e2e-ext", async (stream) => {
      const nc = await connect({ servers: NATS_URL })
      const js = nc.jetstream()
      await js.publish(`${stream}.test`, new TextEncoder().encode(JSON.stringify({ from: "external" })))
      await nc.drain()

      const client = new NatsJetStreamClient({ servers: NATS_URL })
      await client.connect()
      const messages = await client.listMessages(stream, 10)
      expect(messages.length).toBeGreaterThanOrEqual(1)
      expect(messages[0].payload).toEqual({ from: "external" })
      await client.disconnect()
    })
  })
})
