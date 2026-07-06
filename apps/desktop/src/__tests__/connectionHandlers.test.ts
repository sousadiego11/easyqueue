import { describe, it, expect, vi, beforeEach } from "vitest"
import { IPC_CHANNELS } from "@easyqueue/shared"

const mockHandle = vi.fn()
const mockConnect = vi.fn()
const mockDisconnect = vi.fn()
const mockListConnections = vi.fn()
const mockClientConnect = vi.fn()
const mockClientDisconnect = vi.fn()
const mockUpdateConnection = vi.fn()
const mockDeleteConnection = vi.fn()

vi.mock("electron", () => ({
  ipcMain: { handle: (...args: unknown[]) => mockHandle(...args) },
}))

class MockConnectionService {
  connect(...args: unknown[]) { return mockConnect(...args) }
  disconnect(...args: unknown[]) { return mockDisconnect(...args) }
  listConnections(...args: unknown[]) { return mockListConnections(...args) }
  clientConnect(...args: unknown[]) { return mockClientConnect(...args) }
  clientDisconnect(...args: unknown[]) { return mockClientDisconnect(...args) }
  updateConnection(...args: unknown[]) { return mockUpdateConnection(...args) }
  deleteConnection(...args: unknown[]) { return mockDeleteConnection(...args) }
}

vi.mock("../../electron/services/ConnectionService", () => ({
  ConnectionService: MockConnectionService,
}))

const { registerConnectionHandlers } = await import("../../electron/ipc/connectionHandlers")

function getHandler(channel: string) {
  const call = mockHandle.mock.calls.find(([c]: [string]) => c === channel)
  return call ? call[1] : null
}

describe("connectionHandlers", () => {
  let service: MockConnectionService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new MockConnectionService()
    registerConnectionHandlers(service as any)
  })

  describe("CONNECT", () => {
    it("registers handler", () => {
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.CONNECT, expect.any(Function))
    })

    it("calls service.connect with name, provider, config", async () => {
      const handler = getHandler(IPC_CHANNELS.CONNECT)
      await handler({}, "Test", "sqs", { region: "us-east-1" })
      expect(mockConnect).toHaveBeenCalledWith("Test", "sqs", { region: "us-east-1" })
    })
  })

  describe("DISCONNECT", () => {
    it("registers handler", () => {
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.DISCONNECT, expect.any(Function))
    })

    it("calls service.disconnect with connectionId", async () => {
      const handler = getHandler(IPC_CHANNELS.DISCONNECT)
      await handler({}, "conn-1")
      expect(mockDisconnect).toHaveBeenCalledWith("conn-1")
    })
  })

  describe("LIST_CONNECTIONS", () => {
    it("registers handler", () => {
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.LIST_CONNECTIONS, expect.any(Function))
    })

    it("calls service.listConnections", async () => {
      mockListConnections.mockReturnValueOnce([{ id: "c1" }])
      const handler = getHandler(IPC_CHANNELS.LIST_CONNECTIONS)
      const result = await handler()
      expect(mockListConnections).toHaveBeenCalledOnce()
      expect(result).toEqual([{ id: "c1" }])
    })
  })

  describe("CLIENT_CONNECT", () => {
    it("registers handler", () => {
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.CLIENT_CONNECT, expect.any(Function))
    })

    it("calls service.clientConnect with connectionId", async () => {
      const handler = getHandler(IPC_CHANNELS.CLIENT_CONNECT)
      await handler({}, "conn-1")
      expect(mockClientConnect).toHaveBeenCalledWith("conn-1")
    })
  })

  describe("CLIENT_DISCONNECT", () => {
    it("registers handler", () => {
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.CLIENT_DISCONNECT, expect.any(Function))
    })

    it("calls service.clientDisconnect with connectionId", async () => {
      const handler = getHandler(IPC_CHANNELS.CLIENT_DISCONNECT)
      await handler({}, "conn-1")
      expect(mockClientDisconnect).toHaveBeenCalledWith("conn-1")
    })
  })

  describe("UPDATE_CONNECTION", () => {
    it("registers handler", () => {
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.UPDATE_CONNECTION, expect.any(Function))
    })

    it("calls service.updateConnection with all params", async () => {
      const handler = getHandler(IPC_CHANNELS.UPDATE_CONNECTION)
      await handler({}, "conn-1", "New", "rabbitmq", { url: "amqp://..." })
      expect(mockUpdateConnection).toHaveBeenCalledWith("conn-1", "New", "rabbitmq", { url: "amqp://..." })
    })
  })

  describe("DELETE_CONNECTION", () => {
    it("registers handler", () => {
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.DELETE_CONNECTION, expect.any(Function))
    })

    it("calls service.deleteConnection with connectionId", async () => {
      const handler = getHandler(IPC_CHANNELS.DELETE_CONNECTION)
      await handler({}, "conn-1")
      expect(mockDeleteConnection).toHaveBeenCalledWith("conn-1")
    })
  })
})
