import { describe, it, expect, vi, beforeEach } from "vitest"
import { MockProvider } from "./MockProvider"

const mockGetClient = vi.fn()

class MockConnectionService {
  getClient(...args: unknown[]) { return mockGetClient(...args) }
}

const { QueueService } = await import("../../electron/services/QueueService")

describe("QueueService", () => {
  let service: QueueService
  let client: MockProvider

  beforeEach(() => {
    vi.clearAllMocks()
    client = new MockProvider({}, "Test")
    client.queues = ["orders", "payments"]
    mockGetClient.mockReturnValue(client)
    service = new QueueService(new MockConnectionService() as any)
  })

  describe("listQueues", () => {
    it("returns queues from client", async () => {
      const queues = await service.listQueues("conn-1")
      expect(queues).toEqual([{ name: "orders" }, { name: "payments" }])
    })

    it("forwards error when getClient throws", async () => {
      mockGetClient.mockReset()
      mockGetClient.mockImplementation(() => { throw new Error("not found") })
      await expect(service.listQueues("bad")).rejects.toThrow("not found")
    })
  })

  describe("listMessages", () => {
    it("returns messages from client", async () => {
      await client.publish({ queue: "orders", payload: { id: 1 } })
      const msgs = await service.listMessages("conn-1", "orders")
      expect(msgs).toHaveLength(1)
      expect(msgs[0].payload).toEqual({ id: 1 })
    })

    it("forwards limit parameter", async () => {
      for (let i = 0; i < 10; i++) await client.publish({ queue: "orders", payload: i })
      const msgs = await service.listMessages("conn-1", "orders", 3)
      expect(msgs).toHaveLength(3)
    })

    it("forwards error when getClient throws", async () => {
      mockGetClient.mockReset()
      mockGetClient.mockImplementation(() => { throw new Error("not found") })
      await expect(service.listMessages("bad", "q")).rejects.toThrow("not found")
    })
  })
})
