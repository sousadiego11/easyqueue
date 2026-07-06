import { describe, it, expect, vi, beforeEach } from "vitest"
import { IPC_CHANNELS } from "@easyqueue/shared"

const mockHandle = vi.fn()
const mockListQueues = vi.fn()
const mockListMessages = vi.fn()

vi.mock("electron", () => ({
  ipcMain: { handle: (...args: unknown[]) => mockHandle(...args) },
}))

class MockQueueService {
  listQueues(...args: unknown[]) { return mockListQueues(...args) }
  listMessages(...args: unknown[]) { return mockListMessages(...args) }
}

vi.mock("../../electron/services/QueueService", () => ({
  QueueService: MockQueueService,
}))

const { registerQueueHandlers } = await import("../../electron/ipc/queueHandlers")

function getHandler(channel: string) {
  const call = mockHandle.mock.calls.find(([c]: [string]) => c === channel)
  return call ? call[1] : null
}

describe("queueHandlers", () => {
  let service: MockQueueService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new MockQueueService()
    registerQueueHandlers(service as any)
  })

  describe("LIST_QUEUES", () => {
    it("registers handler", () => {
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.LIST_QUEUES, expect.any(Function))
    })

    it("calls service.listQueues with connectionId", async () => {
      mockListQueues.mockResolvedValueOnce([{ name: "orders" }])
      const handler = getHandler(IPC_CHANNELS.LIST_QUEUES)
      const result = await handler({}, "conn-1")
      expect(mockListQueues).toHaveBeenCalledWith("conn-1")
      expect(result).toEqual([{ name: "orders" }])
    })
  })

  describe("LIST_MESSAGES", () => {
    it("registers handler", () => {
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.LIST_MESSAGES, expect.any(Function))
    })

    it("calls service.listMessages with connectionId, queue", async () => {
      const handler = getHandler(IPC_CHANNELS.LIST_MESSAGES)
      await handler({}, "conn-1", "orders", 10)
      expect(mockListMessages).toHaveBeenCalledWith("conn-1", "orders", 10)
    })

    it("calls service.listMessages without limit", async () => {
      const handler = getHandler(IPC_CHANNELS.LIST_MESSAGES)
      await handler({}, "conn-1", "orders", undefined)
      expect(mockListMessages).toHaveBeenCalledWith("conn-1", "orders", undefined)
    })
  })
})
