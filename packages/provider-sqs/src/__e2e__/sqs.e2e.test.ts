import { describe, it, expect } from "vitest"
import {
  SQSClient,
  CreateQueueCommand,
  DeleteQueueCommand,
  GetQueueUrlCommand,
  SendMessageCommand,
} from "@aws-sdk/client-sqs"
import { AWSSQSClient } from "../index"

const ENDPOINT = process.env.SQS_ENDPOINT ?? "http://localhost:4566"
const REGION = process.env.SQS_REGION ?? "us-east-1"
const ACCESS_KEY_ID = process.env.SQS_ACCESS_KEY_ID ?? "test"
const SECRET_ACCESS_KEY = process.env.SQS_SECRET_ACCESS_KEY ?? "test"

const sqs = new SQSClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
})

let sqsAvailable = false

try {
  await sqs.send(new CreateQueueCommand({ QueueName: "easyqueue-e2e-healthcheck" }))
  const { QueueUrl } = await sqs.send(new GetQueueUrlCommand({ QueueName: "easyqueue-e2e-healthcheck" }))
  await sqs.send(new DeleteQueueCommand({ QueueUrl: QueueUrl! }))
  sqsAvailable = true
} catch {
  console.warn(`⚠ SQS not available at ${ENDPOINT} — skipping e2e tests`)
}

async function withQueue(name: string, fn: (queue: string) => Promise<void>) {
  await sqs.send(new CreateQueueCommand({ QueueName: name }))
  try {
    await fn(name)
  } finally {
    try {
      const { QueueUrl } = await sqs.send(new GetQueueUrlCommand({ QueueName: name }))
      await sqs.send(new DeleteQueueCommand({ QueueUrl: QueueUrl! }))
    } catch { }
  }
}

const config = {
  region: REGION,
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  endpoint: ENDPOINT,
}

describe.runIf(sqsAvailable)("SQS e2e", () => {
  it("should connect and disconnect", async () => {
    const client = new AWSSQSClient(config)
    expect(client.connected).toBe(false)
    await client.connect()
    expect(client.connected).toBe(true)
    await client.disconnect()
    expect(client.connected).toBe(false)
  })

  it("should list queues", async () => {
    await withQueue("easyqueue-e2e-list", async (queue) => {
      const client = new AWSSQSClient(config)
      await client.connect()
      const queues = await client.listQueues()
      const names = queues.map((q) => q.name)
      expect(names).toContain(queue)
      await client.disconnect()
    })
  })

  it("should publish and list messages", async () => {
    await withQueue("easyqueue-e2e-pub", async (queue) => {
      const client = new AWSSQSClient(config)
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
      const client = new AWSSQSClient(config)
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
      const client = new AWSSQSClient(config)
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
      const client = new AWSSQSClient(config)
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
      const client = new AWSSQSClient(config)
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
      const { QueueUrl } = await sqs.send(new GetQueueUrlCommand({ QueueName: queue }))
      await sqs.send(new SendMessageCommand({
        QueueUrl: QueueUrl!,
        MessageBody: JSON.stringify({ from: "external" }),
      }))

      const client = new AWSSQSClient(config)
      await client.connect()
      const messages = await client.listMessages(queue, 10)
      expect(messages.length).toBeGreaterThanOrEqual(1)
      expect(messages[0].payload).toEqual({ from: "external" })
      await client.disconnect()
    })
  })
})
