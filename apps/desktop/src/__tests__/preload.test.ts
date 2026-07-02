import { describe, it, expect, vi } from "vitest"
import { IPC_CHANNELS } from "@easyqueue/shared"

const mockInvoke = vi.fn()
const mockSend = vi.fn()
let exposedApi: Record<string, unknown> = {}

vi.mock("electron", () => ({
  contextBridge: {
    exposeInMainWorld: (_key: string, api: Record<string, unknown>) => {
      exposedApi = api
    },
  },
  ipcRenderer: {
    invoke: (...args: unknown[]) => mockInvoke(...args),
    send: (...args: unknown[]) => mockSend(...args),
  },
}))

await import("../../electron/preload")

function api() { return exposedApi }

describe("preload queueApi", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("exposes connect that invokes CONNECT channel", () => {
    api().connect("Test", "sqs", { region: "us-east-1" })
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.CONNECT, "Test", "sqs", { region: "us-east-1" })
  })

  it("exposes disconnect that invokes DISCONNECT channel", () => {
    api().disconnect("conn-1")
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.DISCONNECT, "conn-1")
  })

  it("exposes listConnections that invokes LIST_CONNECTIONS channel", () => {
    api().listConnections()
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.LIST_CONNECTIONS)
  })

  it("exposes listQueues that invokes LIST_QUEUES channel", () => {
    api().listQueues("conn-1")
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.LIST_QUEUES, "conn-1")
  })

  it("exposes listMessages that invokes LIST_MESSAGES channel", () => {
    api().listMessages("conn-1", "orders", 10)
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.LIST_MESSAGES, "conn-1", "orders", 10)
  })

  it("exposes listMessages without limit", () => {
    api().listMessages("conn-1", "orders")
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.LIST_MESSAGES, "conn-1", "orders", undefined)
  })

  it("exposes publish that invokes PUBLISH channel", () => {
    api().publish("conn-1", "orders", { key: "val" }, { h: "1" })
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.PUBLISH, "conn-1", "orders", { key: "val" }, { h: "1" })
  })

  it("exposes publish without headers", () => {
    api().publish("conn-1", "orders", "plain", undefined)
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.PUBLISH, "conn-1", "orders", "plain", undefined)
  })

  it("exposes deleteMessage that invokes DELETE_MESSAGE channel", () => {
    api().deleteMessage("conn-1", "orders", "msg-1")
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.DELETE_MESSAGE, "conn-1", "orders", "msg-1")
  })

  it("exposes releaseMessage that invokes RELEASE_MESSAGE channel", () => {
    api().releaseMessage("conn-1", "orders", "msg-1")
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.RELEASE_MESSAGE, "conn-1", "orders", "msg-1")
  })

  it("exposes releaseQueue that invokes RELEASE_QUEUE channel", () => {
    api().releaseQueue("conn-1", "orders")
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.RELEASE_QUEUE, "conn-1", "orders")
  })

  it("exposes purgeQueue that invokes PURGE_QUEUE channel", () => {
    api().purgeQueue("conn-1", "orders")
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.PURGE_QUEUE, "conn-1", "orders")
  })

  it("exposes clientConnect that invokes CLIENT_CONNECT channel", () => {
    api().clientConnect("conn-1")
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.CLIENT_CONNECT, "conn-1")
  })

  it("exposes clientDisconnect that invokes CLIENT_DISCONNECT channel", () => {
    api().clientDisconnect("conn-1")
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.CLIENT_DISCONNECT, "conn-1")
  })

  it("exposes updateConnection that invokes UPDATE_CONNECTION channel", () => {
    api().updateConnection("conn-1", "New", "sqs", {})
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.UPDATE_CONNECTION, "conn-1", "New", "sqs", {})
  })

  it("exposes deleteConnection that invokes DELETE_CONNECTION channel", () => {
    api().deleteConnection("conn-1")
    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.DELETE_CONNECTION, "conn-1")
  })

  it("exposes minimize that sends WINDOW_MINIMIZE channel", () => {
    api().minimize()
    expect(mockSend).toHaveBeenCalledWith(IPC_CHANNELS.WINDOW_MINIMIZE)
  })

  it("exposes maximize that sends WINDOW_MAXIMIZE channel", () => {
    api().maximize()
    expect(mockSend).toHaveBeenCalledWith(IPC_CHANNELS.WINDOW_MAXIMIZE)
  })

  it("exposes close that sends WINDOW_CLOSE channel", () => {
    api().close()
    expect(mockSend).toHaveBeenCalledWith(IPC_CHANNELS.WINDOW_CLOSE)
  })
})
