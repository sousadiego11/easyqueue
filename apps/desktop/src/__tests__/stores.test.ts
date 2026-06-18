import { describe, it, expect, beforeEach, vi } from "vitest"
import type { ConnectionInfo } from "@/api/queueApi"

const mockConnect = vi.fn()
const mockDisconnect = vi.fn()
const mockListConnections = vi.fn()
const mockUpdateConnection = vi.fn()
const mockClientConnect = vi.fn()
const mockClientDisconnect = vi.fn()
const mockListMessages = vi.fn()
const mockPublish = vi.fn()
const mockDeleteMessage = vi.fn()
const mockPurgeQueue = vi.fn()

vi.mock("@/api/queueApi", () => ({
  queueApi: {
    connect: (...args: unknown[]) => mockConnect(...args),
    disconnect: (...args: unknown[]) => mockDisconnect(...args),
    listConnections: (...args: unknown[]) => mockListConnections(...args),
    updateConnection: (...args: unknown[]) => mockUpdateConnection(...args),
    clientConnect: (...args: unknown[]) => mockClientConnect(...args),
    clientDisconnect: (...args: unknown[]) => mockClientDisconnect(...args),
    listMessages: (...args: unknown[]) => mockListMessages(...args),
    publish: (...args: unknown[]) => mockPublish(...args),
    deleteMessage: (...args: unknown[]) => mockDeleteMessage(...args),
    purgeQueue: (...args: unknown[]) => mockPurgeQueue(...args),
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
  },
}))

function makeConn(overrides: Partial<ConnectionInfo> = {}): ConnectionInfo {
  return {
    id: "conn-1",
    name: "Test",
    provider: "sqs",
    connected: true,
    config: {},
    ...overrides,
  }
}

describe("useConnectionStore", () => {
  let useConnectionStore: typeof import("@/stores/useConnectionStore")["useConnectionStore"]

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    useConnectionStore = (await import("@/stores/useConnectionStore")).useConnectionStore
    useConnectionStore.setState({ connections: [], isLoading: false, error: null })
  })

  it("starts with empty connections", () => {
    const s = useConnectionStore.getState()
    expect(s.connections).toEqual([])
    expect(s.isLoading).toBe(false)
    expect(s.error).toBeNull()
  })

  it("connect adds a connection", async () => {
    const conn = makeConn()
    mockConnect.mockResolvedValueOnce(conn)
    const result = await useConnectionStore.getState().connect("Test", "sqs", {})
    expect(result).toEqual(conn)
    expect(useConnectionStore.getState().connections).toEqual([conn])
  })

  it("connect sets error on failure", async () => {
    mockConnect.mockRejectedValueOnce(new Error("fail"))
    await expect(useConnectionStore.getState().connect("Test", "sqs", {})).rejects.toThrow("fail")
    expect(useConnectionStore.getState().error).toBe("fail")
  })

  it("disconnect removes a connection", async () => {
    const conn = makeConn()
    useConnectionStore.setState({ connections: [conn] })
    mockDisconnect.mockResolvedValueOnce(undefined)
    await useConnectionStore.getState().disconnect("conn-1")
    expect(useConnectionStore.getState().connections).toEqual([])
  })

  it("loadConnections replaces the list", async () => {
    const conns = [makeConn({ id: "a" }), makeConn({ id: "b" })]
    mockListConnections.mockResolvedValueOnce(conns)
    await useConnectionStore.getState().loadConnections()
    expect(useConnectionStore.getState().connections).toEqual(conns)
  })

  it("toggleConnection disconnects when connected", async () => {
    const conn = makeConn({ id: "conn-1", connected: true })
    const disconnected = makeConn({ id: "conn-1", connected: false })
    useConnectionStore.setState({ connections: [conn] })
    mockClientDisconnect.mockResolvedValueOnce(disconnected)
    await useConnectionStore.getState().toggleConnection("conn-1")
    expect(useConnectionStore.getState().connections[0].connected).toBe(false)
  })

  it("toggleConnection connects when disconnected", async () => {
    const conn = makeConn({ id: "conn-1", connected: false })
    const connected = makeConn({ id: "conn-1", connected: true })
    useConnectionStore.setState({ connections: [conn] })
    mockClientConnect.mockResolvedValueOnce(connected)
    await useConnectionStore.getState().toggleConnection("conn-1")
    expect(useConnectionStore.getState().connections[0].connected).toBe(true)
  })

  it("updateConnection replaces the old connection", async () => {
    const old = makeConn({ id: "conn-1", name: "Old" })
    const updated = makeConn({ id: "conn-1", name: "Updated" })
    useConnectionStore.setState({ connections: [old] })
    mockUpdateConnection.mockResolvedValueOnce(updated)
    await useConnectionStore.getState().updateConnection("conn-1", "Updated", "sqs", {})
    expect(useConnectionStore.getState().connections).toHaveLength(1)
    expect(useConnectionStore.getState().connections[0].name).toBe("Updated")
  })
})

describe("useMessageStore", () => {
  let useMessageStore: typeof import("@/stores/useMessageStore")["useMessageStore"]

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    useMessageStore = (await import("@/stores/useMessageStore")).useMessageStore
    useMessageStore.setState({ messages: [], selectedMessage: null, isLoadingMessages: false, error: null })
  })

  it("starts with empty messages", () => {
    const s = useMessageStore.getState()
    expect(s.messages).toEqual([])
    expect(s.selectedMessage).toBeNull()
  })

  it("loadMessages replaces messages", async () => {
    const msgs = [{ id: "m1", queue: "q", payload: {}, timestamp: new Date() }]
    mockListMessages.mockResolvedValueOnce(msgs)
    await useMessageStore.getState().loadMessages("conn-1", "q", 10)
    expect(useMessageStore.getState().messages).toEqual(msgs)
  })

  it("deleteMessage removes a message from the list", async () => {
    const msgs = [
      { id: "m1", queue: "q", payload: {}, timestamp: new Date() },
      { id: "m2", queue: "q", payload: {}, timestamp: new Date() },
    ]
    useMessageStore.setState({ messages: msgs })
    mockDeleteMessage.mockResolvedValueOnce(undefined)
    await useMessageStore.getState().deleteMessage("conn-1", "q", "m1")
    expect(useMessageStore.getState().messages).toHaveLength(1)
    expect(useMessageStore.getState().messages[0].id).toBe("m2")
  })

  it("purgeQueue clears all messages", async () => {
    const msgs = [
      { id: "m1", queue: "q", payload: {}, timestamp: new Date() },
      { id: "m2", queue: "q", payload: {}, timestamp: new Date() },
    ]
    useMessageStore.setState({ messages: msgs, selectedMessage: msgs[0] })
    mockPurgeQueue.mockResolvedValueOnce(undefined)
    await useMessageStore.getState().purgeQueue("conn-1", "q")
    expect(useMessageStore.getState().messages).toEqual([])
    expect(useMessageStore.getState().selectedMessage).toBeNull()
  })

  it("setSelectedMessage updates selected message", () => {
    const msg = { id: "m1", queue: "q", payload: {}, timestamp: new Date() }
    useMessageStore.getState().setSelectedMessage(msg)
    expect(useMessageStore.getState().selectedMessage).toBe(msg)
  })

  it("clearMessages resets state", () => {
    useMessageStore.setState({
      messages: [{ id: "m1", queue: "q", payload: {}, timestamp: new Date() }],
      selectedMessage: { id: "m1", queue: "q", payload: {}, timestamp: new Date() },
      error: "some error",
    })
    useMessageStore.getState().clearMessages()
    const s = useMessageStore.getState()
    expect(s.messages).toEqual([])
    expect(s.selectedMessage).toBeNull()
    expect(s.error).toBeNull()
  })
})
