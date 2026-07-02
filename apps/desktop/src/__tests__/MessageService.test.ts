import { describe, it, expect, vi, beforeEach } from "vitest"
import { MockProvider } from "./MockProvider"

const mockGetClient = vi.fn()

class MockConnectionService {
  getClient(...args: unknown[]) { return mockGetClient(...args) }
}

const { MessageService } = await import("../../electron/services/MessageService")

describe("MessageService", () => {
  let service: MessageService
  let client: MockProvider

  beforeEach(() => {
    vi.clearAllMocks()
    client = new MockProvider({}, "Test")
    client.queues = ["orders"]
    mockGetClient.mockReturnValue(client)
    service = new MessageService(new MockConnectionService() as any)
  })

  describe("publish", () => {
    it("calls client.publish with queue, payload, headers", async () => {
      await service.publish("conn-1", "orders", { key: "value" }, { trace: "abc" })
      const msgs = await client.listMessages("orders")
      expect(msgs).toHaveLength(1)
      expect(msgs[0].payload).toEqual({ key: "value" })
      expect(msgs[0].headers).toEqual({ trace: "abc" })
    })

    it("calls client.publish without headers", async () => {
      await service.publish("conn-1", "orders", "plain")
      const msgs = await client.listMessages("orders")
      expect(msgs).toHaveLength(1)
      expect(msgs[0].payload).toBe("plain")
    })

    it("forwards error when getClient throws", async () => {
      mockGetClient.mockReset()
      mockGetClient.mockImplementation(() => { throw new Error("not found") })
      await expect(service.publish("bad", "q", {})).rejects.toThrow("not found")
    })
  })

  describe("deleteMessage", () => {
    it("calls client.deleteMessage with queue and messageId", async () => {
      await client.publish({ queue: "orders", payload: {} })
      const msgs = await client.listMessages("orders")
      await service.deleteMessage("conn-1", "orders", msgs[0].id)
      const after = await client.listMessages("orders")
      expect(after).toHaveLength(0)
    })

    it("forwards error when getClient throws", async () => {
      mockGetClient.mockReset()
      mockGetClient.mockImplementation(() => { throw new Error("not found") })
      await expect(service.deleteMessage("bad", "q", "id")).rejects.toThrow("not found")
    })
  })

  describe("releaseMessage", () => {
    it("calls client.releaseMessage with queue and messageId", async () => {
      await client.publish({ queue: "orders", payload: {} })
      const msgs = await client.listMessages("orders")
      await service.releaseMessage("conn-1", "orders", msgs[0].id)
      const after = await client.listMessages("orders")
      expect(after).toHaveLength(0)
    })

    it("forwards error when getClient throws", async () => {
      mockGetClient.mockReset()
      mockGetClient.mockImplementation(() => { throw new Error("not found") })
      await expect(service.releaseMessage("bad", "q", "id")).rejects.toThrow("not found")
    })
  })

  describe("releaseQueue", () => {
    it("calls client.releaseQueue with queue", async () => {
      await client.publish({ queue: "orders", payload: {} })
      await service.releaseQueue("conn-1", "orders")
      const msgs = await client.listMessages("orders")
      expect(msgs).toHaveLength(0)
    })

    it("forwards error when getClient throws", async () => {
      mockGetClient.mockReset()
      mockGetClient.mockImplementation(() => { throw new Error("not found") })
      await expect(service.releaseQueue("bad", "q")).rejects.toThrow("not found")
    })
  })

  describe("purgeQueue", () => {
    it("calls client.purgeQueue with queue", async () => {
      await client.publish({ queue: "orders", payload: {} })
      await service.purgeQueue("conn-1", "orders")
      const msgs = await client.listMessages("orders")
      expect(msgs).toHaveLength(0)
    })

    it("forwards error when getClient throws", async () => {
      mockGetClient.mockReset()
      mockGetClient.mockImplementation(() => { throw new Error("not found") })
      await expect(service.purgeQueue("bad", "q")).rejects.toThrow("not found")
    })
  })
})
