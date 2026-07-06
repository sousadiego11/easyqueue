import { describe, it, expect } from "vitest"
import { createClient } from "redis"
import { RedisStreamClient } from "../index"

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379"

let redisAvailable = false

try {
  const client = createClient({ url: REDIS_URL })
  await client.connect()
  await client.quit()
  redisAvailable = true
} catch {
  console.warn(`⚠ Redis not available at ${REDIS_URL} — skipping e2e tests`)
}

async function withStream(name: string, fn: (stream: string) => Promise<void>) {
  try {
    await fn(name)
  } finally {
    try {
      const client = createClient({ url: REDIS_URL })
      await client.connect()
      await client.del(name)
      await client.quit()
    } catch { }
  }
}

const config = { url: REDIS_URL }

describe.runIf(redisAvailable)("Redis Streams e2e", () => {
  it("should connect and disconnect", async () => {
    const client = new RedisStreamClient(config)
    expect(client.connected).toBe(false)
    await client.connect()
    expect(client.connected).toBe(true)
    await client.disconnect()
    expect(client.connected).toBe(false)
  })

  it("should list queues", async () => {
    await withStream("easyqueue-e2e-list", async (stream) => {
      const setup = createClient({ url: REDIS_URL })
      await setup.connect()
      await setup.xAdd(stream, "*", { payload: JSON.stringify({ temp: true }) })
      await setup.quit()

      const client = new RedisStreamClient(config)
      await client.connect()
      const queues = await client.listQueues()
      const names = queues.map((q) => q.name)
      expect(names).toContain(stream)
      await client.disconnect()
    })
  })

  it("should publish and list messages", async () => {
    await withStream("easyqueue-e2e-pub", async (stream) => {
      const client = new RedisStreamClient(config)
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
      const client = new RedisStreamClient(config)
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
      const client = new RedisStreamClient(config)
      await client.connect()

      await client.publish({ queue: stream, payload: { n: 2 } })

      const msgs1 = await client.listMessages(stream, 10)
      expect(msgs1.length).toBeGreaterThanOrEqual(1)

      await client.releaseMessage(stream, msgs1[0].id)

      const msgs2 = await client.listMessages(stream, 10)
      const reappeared = msgs2.find((m) => m.id === msgs1[0].id)
      expect(reappeared).toBeUndefined()
      const withSamePayload = msgs2.find((m) => JSON.stringify(m.payload) === JSON.stringify(msgs1[0].payload))
      expect(withSamePayload).toBeDefined()

      await client.disconnect()
    })
  })

  it("should ack all via purgeQueue", async () => {
    await withStream("easyqueue-e2e-purge", async (stream) => {
      const client = new RedisStreamClient(config)
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
      const client = new RedisStreamClient(config)
      await client.connect()

      await client.publish({ queue: stream, payload: { n: 5 } })
      await client.publish({ queue: stream, payload: { n: 6 } })
      await client.publish({ queue: stream, payload: { n: 7 } })

      const msgs1 = await client.listMessages(stream, 10)
      expect(msgs1.length).toBeGreaterThanOrEqual(3)
      const payloads1 = msgs1.map((m) => JSON.stringify(m.payload))

      await client.releaseQueue(stream)

      const msgs2 = await client.listMessages(stream, 10)
      const payloads2 = new Set(msgs2.map((m) => JSON.stringify(m.payload)))
      for (const payload of payloads1) {
        expect(payloads2.has(payload)).toBe(true)
      }

      await client.disconnect()
    })
  })

  it("should handle messages published by an external producer", async () => {
    await withStream("easyqueue-e2e-ext", async (stream) => {
      const ext = createClient({ url: REDIS_URL })
      await ext.connect()
      await ext.xAdd(stream, "*", { payload: JSON.stringify({ from: "external" }) })
      await ext.quit()

      const client = new RedisStreamClient(config)
      await client.connect()
      const messages = await client.listMessages(stream, 10)
      expect(messages.length).toBeGreaterThanOrEqual(1)
      expect(messages[0].payload).toEqual({ from: "external" })
      await client.disconnect()
    })
  })
})
