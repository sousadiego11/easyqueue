import { describe, it, expect } from "vitest"
import amqplib from "amqplib"
import { RabbitMqClient } from "../index"

const AMQP_URL = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672"
const MANAGEMENT_URL = process.env.RABBITMQ_MGMT_URL ?? "http://localhost:15672"

let rabbitAvailable = false

try {
  const conn = await amqplib.connect(AMQP_URL)
  await conn.close()
  rabbitAvailable = true
} catch {
  console.warn(`⚠ RabbitMQ not available at ${AMQP_URL} — skipping e2e tests`)
}

async function withQueue(name: string, fn: (queue: string) => Promise<void>) {
  const conn = await amqplib.connect(AMQP_URL)
  const ch = await conn.createChannel()
  await ch.assertQueue(name, { durable: false })
  try {
    await fn(name)
  } finally {
    try { await ch.deleteQueue(name) } catch { }
    await conn.close()
  }
}

const config = {
  url: AMQP_URL,
  managementUrl: MANAGEMENT_URL,
  managementUser: "guest",
  managementPassword: "guest",
}

describe.runIf(rabbitAvailable)("RabbitMQ e2e", () => {
  it("should connect and disconnect", async () => {
    const client = new RabbitMqClient(config)
    expect(client.connected).toBe(false)
    await client.connect()
    expect(client.connected).toBe(true)
    await client.disconnect()
    expect(client.connected).toBe(false)
  })

  it("should list queues", async () => {
    await withQueue("easyqueue-e2e-list", async (queue) => {
      const client = new RabbitMqClient(config)
      await client.connect()
      const queues = await client.listQueues()
      const names = queues.map((q) => q.name)
      expect(names).toContain(queue)
      await client.disconnect()
    })
  })

  it("should publish and list messages", async () => {
    await withQueue("easyqueue-e2e-pub", async (queue) => {
      const client = new RabbitMqClient(config)
      await client.connect()

      await client.publish({ queue, payload: { hello: "world" }, headers: { source: "e2e" } })

      const messages = await client.listMessages(queue, 10)
      expect(messages.length).toBeGreaterThanOrEqual(1)
      expect(messages[0].payload).toEqual({ hello: "world" })
      expect(messages[0].headers).toEqual({ source: "e2e" })

      await client.disconnect()
    })
  })

  it("should ack a message via deleteMessage", async () => {
    await withQueue("easyqueue-e2e-ack", async (queue) => {
      const client = new RabbitMqClient(config)
      await client.connect()

      await client.publish({ queue, payload: { n: 1 } })

      const msgs1 = await client.listMessages(queue, 10)
      expect(msgs1.length).toBeGreaterThanOrEqual(1)

      await client.deleteMessage(queue, msgs1[0].id)

      const msgs2 = await client.listMessages(queue, 10)
      const stillThere = msgs2.some((m) => m.id === msgs1[0].id)
      expect(stillThere).toBe(false)

      await client.disconnect()
    })
  })

  it("should nak a message via releaseMessage", async () => {
    await withQueue("easyqueue-e2e-nak", async (queue) => {
      const client = new RabbitMqClient(config)
      await client.connect()

      await client.publish({ queue, payload: { n: 2 } })

      const msgs1 = await client.listMessages(queue, 10)
      expect(msgs1.length).toBeGreaterThanOrEqual(1)

      await client.releaseMessage(queue, msgs1[0].id)

      const msgs2 = await client.listMessages(queue, 10)
      const reappeared = msgs2.find((m) => m.id === msgs1[0].id)
      expect(reappeared).toBeDefined()

      await client.disconnect()
    })
  })

  it("should ack all via purgeQueue", async () => {
    await withQueue("easyqueue-e2e-purge", async (queue) => {
      const client = new RabbitMqClient(config)
      await client.connect()

      await client.publish({ queue, payload: { n: 3 } })
      await client.publish({ queue, payload: { n: 4 } })

      const msgs1 = await client.listMessages(queue, 10)
      expect(msgs1.length).toBeGreaterThanOrEqual(2)

      await client.purgeQueue(queue)

      const msgs2 = await client.listMessages(queue, 10)
      expect(msgs2.length).toBe(0)

      await client.disconnect()
    })
  })

  it("should nak all via releaseQueue", async () => {
    await withQueue("easyqueue-e2e-rlq", async (queue) => {
      const client = new RabbitMqClient(config)
      await client.connect()

      await client.publish({ queue, payload: { n: 5 } })
      await client.publish({ queue, payload: { n: 6 } })
      await client.publish({ queue, payload: { n: 7 } })

      const msgs1 = await client.listMessages(queue, 10)
      expect(msgs1.length).toBeGreaterThanOrEqual(3)
      const ids1 = msgs1.map((m) => m.id)

      await client.releaseQueue(queue)

      const msgs2 = await client.listMessages(queue, 10)
      const ids2 = new Set(msgs2.map((m) => m.id))
      for (const id of ids1) {
        expect(ids2.has(id)).toBe(true)
      }

      await client.disconnect()
    })
  })

  it("should handle messages published by an external producer", async () => {
    await withQueue("easyqueue-e2e-ext", async (queue) => {
      const conn = await amqplib.connect(AMQP_URL)
      const ch = await conn.createConfirmChannel()
      ch.publish("", queue, Buffer.from(JSON.stringify({ from: "external" })))
      await ch.waitForConfirms()
      await conn.close()

      const client = new RabbitMqClient(config)
      await client.connect()
      const messages = await client.listMessages(queue, 10)
      expect(messages.length).toBeGreaterThanOrEqual(1)
      expect(messages[0].payload).toEqual({ from: "external" })
      await client.disconnect()
    })
  })
})
