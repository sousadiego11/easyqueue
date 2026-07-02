import { describe, it, expect, vi, beforeEach } from "vitest"
import { IPC_CHANNELS } from "@easyqueue/shared"

const mockHandle = vi.fn()
const mockPublish = vi.fn()
const mockDeleteMessage = vi.fn()
const mockReleaseMessage = vi.fn()
const mockReleaseQueue = vi.fn()
const mockPurgeQueue = vi.fn()

vi.mock("electron", () => ({
  ipcMain: { handle: (...args: unknown[]) => mockHandle(...args) },
}))

class MockMessageService {
  publish(...args: unknown[]) { return mockPublish(...args) }
  deleteMessage(...args: unknown[]) { return mockDeleteMessage(...args) }
  releaseMessage(...args: unknown[]) { return mockReleaseMessage(...args) }
  releaseQueue(...args: unknown[]) { return mockReleaseQueue(...args) }
  purgeQueue(...args: unknown[]) { return mockPurgeQueue(...args) }
}

vi.mock("../../electron/services/MessageService", () => ({
  MessageService: MockMessageService,
}))

const { registerMessageHandlers } = await import("../../electron/ipc/messageHandlers")

function getHandler(channel: string) {
  const call = mockHandle.mock.calls.find(([c]: [string]) => c === channel)
  return call ? call[1] : null
}

describe("messageHandlers", () => {
  let service: MockMessageService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new MockMessageService()
    registerMessageHandlers(service as any)
  })

  describe("PUBLISH", () => {
    it("registers handler", () => {
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.PUBLISH, expect.any(Function))
    })

    it("calls service.publish with all params", async () => {
      const handler = getHandler(IPC_CHANNELS.PUBLISH)
      await handler({}, "conn-1", "orders", { key: "val" }, { h: "1" })
      expect(mockPublish).toHaveBeenCalledWith("conn-1", "orders", { key: "val" }, { h: "1" })
    })

    it("calls service.publish without headers", async () => {
      const handler = getHandler(IPC_CHANNELS.PUBLISH)
      await handler({}, "conn-1", "orders", "plain", undefined)
      expect(mockPublish).toHaveBeenCalledWith("conn-1", "orders", "plain", undefined)
    })
  })

  describe("DELETE_MESSAGE", () => {
    it("registers handler", () => {
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.DELETE_MESSAGE, expect.any(Function))
    })

    it("calls service.deleteMessage with connectionId, queue, messageId", async () => {
      const handler = getHandler(IPC_CHANNELS.DELETE_MESSAGE)
      await handler({}, "conn-1", "orders", "msg-1")
      expect(mockDeleteMessage).toHaveBeenCalledWith("conn-1", "orders", "msg-1")
    })
  })

  describe("RELEASE_MESSAGE", () => {
    it("registers handler", () => {
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.RELEASE_MESSAGE, expect.any(Function))
    })

    it("calls service.releaseMessage with connectionId, queue, messageId", async () => {
      const handler = getHandler(IPC_CHANNELS.RELEASE_MESSAGE)
      await handler({}, "conn-1", "orders", "msg-1")
      expect(mockReleaseMessage).toHaveBeenCalledWith("conn-1", "orders", "msg-1")
    })
  })

  describe("RELEASE_QUEUE", () => {
    it("registers handler", () => {
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.RELEASE_QUEUE, expect.any(Function))
    })

    it("calls service.releaseQueue with connectionId, queue", async () => {
      const handler = getHandler(IPC_CHANNELS.RELEASE_QUEUE)
      await handler({}, "conn-1", "orders")
      expect(mockReleaseQueue).toHaveBeenCalledWith("conn-1", "orders")
    })
  })

  describe("PURGE_QUEUE", () => {
    it("registers handler", () => {
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.PURGE_QUEUE, expect.any(Function))
    })

    it("calls service.purgeQueue with connectionId, queue", async () => {
      const handler = getHandler(IPC_CHANNELS.PURGE_QUEUE)
      await handler({}, "conn-1", "orders")
      expect(mockPurgeQueue).toHaveBeenCalledWith("conn-1", "orders")
    })
  })
})
