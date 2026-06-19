import { describe, it, expect } from "vitest"
import { MockProvider } from "./MockProvider"

describe("MockProvider", () => {
  it("starts disconnected", () => {
    const p = new MockProvider()
    expect(p.connected).toBe(false)
  })

  it("connect sets connected to true", async () => {
    const p = new MockProvider()
    await p.connect()
    expect(p.connected).toBe(true)
  })

  it("disconnect sets connected to false", async () => {
    const p = new MockProvider()
    await p.connect()
    await p.disconnect()
    expect(p.connected).toBe(false)
  })

  it("listQueues returns configured queues", async () => {
    const p = new MockProvider({ queues: ["a", "b"] })
    p.queues = ["a", "b"]
    const q = await p.listQueues()
    expect(q).toEqual([{ name: "a" }, { name: "b" }])
  })

  it("publish adds a message to the queue", async () => {
    const p = new MockProvider()
    await p.publish({ queue: "orders", payload: { orderId: 1 } })
    const msgs = await p.listMessages("orders")
    expect(msgs).toHaveLength(1)
    expect(msgs[0].payload).toEqual({ orderId: 1 })
  })

  it("publish assigns id and timestamp", async () => {
    const p = new MockProvider()
    await p.publish({ queue: "orders", payload: "hello" })
    const msgs = await p.listMessages("orders")
    expect(msgs[0].id).toBeTruthy()
    expect(msgs[0].timestamp).toBeInstanceOf(Date)
  })

  it("publish with headers stores headers", async () => {
    const p = new MockProvider()
    await p.publish({ queue: "orders", payload: {}, headers: { tracing: "abc" } })
    const msgs = await p.listMessages("orders")
    expect(msgs[0].headers).toEqual({ tracing: "abc" })
  })

  it("listMessages returns up to limit", async () => {
    const p = new MockProvider()
    for (let i = 0; i < 10; i++) {
      await p.publish({ queue: "q", payload: i })
    }
    const msgs = await p.listMessages("q", 3)
    expect(msgs).toHaveLength(3)
  })

  it("listMessages returns all messages if limit not specified", async () => {
    const p = new MockProvider()
    for (let i = 0; i < 5; i++) {
      await p.publish({ queue: "q", payload: i })
    }
    const msgs = await p.listMessages("q")
    expect(msgs).toHaveLength(5)
  })

  it("deleteMessage removes a message by id", async () => {
    const p = new MockProvider()
    await p.publish({ queue: "orders", payload: { id: 1 } })
    await p.publish({ queue: "orders", payload: { id: 2 } })
    const before = await p.listMessages("orders")
    await p.deleteMessage("orders", before[0].id)
    const after = await p.listMessages("orders")
    expect(after).toHaveLength(1)
    expect(after[0].payload).toEqual({ id: 2 })
  })

  it("purgeQueue removes all messages from a queue", async () => {
    const p = new MockProvider()
    await p.publish({ queue: "orders", payload: "a" })
    await p.publish({ queue: "orders", payload: "b" })
    await p.purgeQueue("orders")
    const msgs = await p.listMessages("orders")
    expect(msgs).toHaveLength(0)
  })

  it("purgeQueue only affects the specified queue", async () => {
    const p = new MockProvider()
    await p.publish({ queue: "orders", payload: "a" })
    await p.publish({ queue: "payments", payload: "b" })
    await p.purgeQueue("orders")
    expect(await p.listMessages("orders")).toHaveLength(0)
    expect(await p.listMessages("payments")).toHaveLength(1)
  })

  it("disconnect clears all messages", async () => {
    const p = new MockProvider()
    await p.publish({ queue: "orders", payload: "x" })
    await p.disconnect()
    const msgs = await p.listMessages("orders")
    expect(msgs).toHaveLength(0)
  })

  it("listMessages returns empty array for unknown queue", async () => {
    const p = new MockProvider()
    const msgs = await p.listMessages("nonexistent")
    expect(msgs).toEqual([])
  })

  it("releaseMessage removes a single message by id", async () => {
    const p = new MockProvider()
    await p.publish({ queue: "orders", payload: { id: 1 } })
    await p.publish({ queue: "orders", payload: { id: 2 } })
    const before = await p.listMessages("orders")
    await p.releaseMessage("orders", before[0].id)
    const after = await p.listMessages("orders")
    expect(after).toHaveLength(1)
    expect(after[0].payload).toEqual({ id: 2 })
  })

  it("releaseMessage does nothing for unknown message id", async () => {
    const p = new MockProvider()
    await p.publish({ queue: "orders", payload: "x" })
    await p.releaseMessage("orders", "nonexistent")
    const msgs = await p.listMessages("orders")
    expect(msgs).toHaveLength(1)
  })

  it("releaseQueue removes all messages from a queue", async () => {
    const p = new MockProvider()
    await p.publish({ queue: "orders", payload: "a" })
    await p.publish({ queue: "orders", payload: "b" })
    await p.releaseQueue("orders")
    const msgs = await p.listMessages("orders")
    expect(msgs).toHaveLength(0)
  })

  it("releaseQueue only affects the specified queue", async () => {
    const p = new MockProvider()
    await p.publish({ queue: "orders", payload: "a" })
    await p.publish({ queue: "payments", payload: "b" })
    await p.releaseQueue("orders")
    expect(await p.listMessages("orders")).toHaveLength(0)
    expect(await p.listMessages("payments")).toHaveLength(1)
  })
})
