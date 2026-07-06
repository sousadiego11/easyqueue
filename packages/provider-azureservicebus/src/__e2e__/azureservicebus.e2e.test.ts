import { describe, it, expect } from "vitest"
import { ServiceBusClient } from "@azure/service-bus"
import { AzureServiceBusClient } from "../index"

const CONNECTION_STRING = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING
  ?? "Endpoint=sb://localhost:5673;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=EasyQueue@2024!;UseDevelopmentEmulator=true"

const QUEUES = ["orders", "payments", "notifications"] as const

let sbAvailable = false

try {
  const client = new ServiceBusClient(CONNECTION_STRING)
  const receiver = client.createReceiver(QUEUES[0], { receiveMode: "peekLock" })
  await receiver.receiveMessages(1, { maxWaitTimeInMs: 2000 })
  await receiver.close()
  await client.close()
  sbAvailable = true
} catch {
  console.warn(`⚠ Azure Service Bus not available — skipping e2e tests`)
}

async function drainQueue(queue: string) {
  try {
    const client = new ServiceBusClient(CONNECTION_STRING)
    const receiver = client.createReceiver(queue, { receiveMode: "peekLock" })
    const msgs = await receiver.receiveMessages(100, { maxWaitTimeInMs: 2000 })
    for (const msg of msgs) {
      await receiver.completeMessage(msg)
    }
    await receiver.close()
    await client.close()
  } catch { }
}

let queueIndex = 0
function nextQueue(): string {
  const q = QUEUES[queueIndex % QUEUES.length]
  queueIndex++
  return q
}

const config = { connectionString: CONNECTION_STRING }

describe.runIf(sbAvailable)("Azure Service Bus e2e", () => {
  it("should connect and disconnect", async () => {
    const client = new AzureServiceBusClient(config)
    expect(client.connected).toBe(false)
    await client.connect()
    expect(client.connected).toBe(true)
    await client.disconnect()
    expect(client.connected).toBe(false)
  })

  it("should list queues", async () => {
    const client = new AzureServiceBusClient(config)
    await client.connect()
    const queues = await client.listQueues()
    const names = queues.map((q) => q.name)
    for (const q of QUEUES) {
      expect(names).toContain(q)
    }
    await client.disconnect()
  })

  it("should publish and list messages", async () => {
    const queue = nextQueue()
    await drainQueue(queue)
    const client = new AzureServiceBusClient(config)
    await client.connect()

    await client.publish({ queue, payload: { hello: "world" }, headers: { source: "e2e" } })

    const messages = await client.listMessages(queue, 10)
    expect(messages.length).toBeGreaterThanOrEqual(1)
    expect(messages[0].payload).toEqual({ hello: "world" })
    expect(messages[0].headers).toEqual({ source: "e2e" })

    await client.disconnect()
  })

  it("should ack a message via deleteMessage", async () => {
    const queue = nextQueue()
    await drainQueue(queue)
    const client = new AzureServiceBusClient(config)
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

  it("should nak a message via releaseMessage", async () => {
    const queue = nextQueue()
    await drainQueue(queue)
    const client = new AzureServiceBusClient(config)
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

  it("should ack all via purgeQueue", async () => {
    const queue = nextQueue()
    await drainQueue(queue)
    const client = new AzureServiceBusClient(config)
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

  it("should nak all via releaseQueue", async () => {
    const queue = nextQueue()
    await drainQueue(queue)
    const client = new AzureServiceBusClient(config)
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

  it("should handle messages published by an external producer", async () => {
    const queue = nextQueue()
    await drainQueue(queue)
    const ext = new ServiceBusClient(CONNECTION_STRING)
    const sender = ext.createSender(queue)
    await sender.sendMessages({ body: { from: "external" } })
    await sender.close()
    await ext.close()

    const client = new AzureServiceBusClient(config)
    await client.connect()
    const messages = await client.listMessages(queue, 10)
    expect(messages.length).toBeGreaterThanOrEqual(1)
    expect(messages[0].payload).toEqual({ from: "external" })
    await client.disconnect()
  })
})
