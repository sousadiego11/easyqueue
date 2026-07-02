import { describe, it, expect, beforeEach, vi } from "vitest"
import type { ConnectionInfo } from "@/api/queueApi"

const mockConnect = vi.fn()
const mockDisconnect = vi.fn()
const mockDeleteConnection = vi.fn()
const mockListConnections = vi.fn()
const mockUpdateConnection = vi.fn()
const mockClientConnect = vi.fn()
const mockClientDisconnect = vi.fn()
const mockListMessages = vi.fn()
const mockPublish = vi.fn()
const mockDeleteMessage = vi.fn()
const mockReleaseMessage = vi.fn()
const mockReleaseQueue = vi.fn()
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
    releaseMessage: (...args: unknown[]) => mockReleaseMessage(...args),
    releaseQueue: (...args: unknown[]) => mockReleaseQueue(...args),
    purgeQueue: (...args: unknown[]) => mockPurgeQueue(...args),
    deleteConnection: (...args: unknown[]) => mockDeleteConnection(...args),
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
  },
}))

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

function makeMsg(overrides: Partial<{ id: string; queue: string; payload: unknown; timestamp: Date }> = {}) {
  return { id: "m1", queue: "q", payload: {}, timestamp: new Date(), ...overrides }
}

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
  let useAppStore: typeof import("@/stores/useAppStore")["useAppStore"]

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    useConnectionStore = (await import("@/stores/useConnectionStore")).useConnectionStore
    useConnectionStore.setState({ connections: [], isLoading: false, error: null })
    useAppStore = (await import("@/stores/useAppStore")).useAppStore
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

  it("disconnect sets error on failure", async () => {
    const conn = makeConn()
    useConnectionStore.setState({ connections: [conn] })
    mockDisconnect.mockRejectedValueOnce(new Error("fail disconnect"))
    await expect(useConnectionStore.getState().disconnect("conn-1")).rejects.toThrow("fail disconnect")
    expect(useConnectionStore.getState().error).toBe("fail disconnect")
  })

  it("disconnect keeps connection in list on error", async () => {
    const conn = makeConn()
    useConnectionStore.setState({ connections: [conn] })
    mockDisconnect.mockRejectedValueOnce(new Error("fail"))
    await expect(useConnectionStore.getState().disconnect("conn-1")).rejects.toThrow()
    expect(useConnectionStore.getState().connections).toEqual([conn])
  })

  it("loadConnections replaces the list", async () => {
    const conns = [makeConn({ id: "a" }), makeConn({ id: "b" })]
    mockListConnections.mockResolvedValueOnce(conns)
    await useConnectionStore.getState().loadConnections()
    expect(useConnectionStore.getState().connections).toEqual(conns)
  })

  it("loadConnections sets error on failure", async () => {
    mockListConnections.mockRejectedValueOnce(new Error("load fail"))
    await expect(useConnectionStore.getState().loadConnections()).rejects.toThrow("load fail")
    expect(useConnectionStore.getState().error).toBe("load fail")
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

  it("toggleConnection throws when connection not found", async () => {
    await expect(useConnectionStore.getState().toggleConnection("nonexistent")).rejects.toThrow("Connection not found")
  })

  it("toggleConnection updates appStore currentConnection when matching", async () => {
    const conn = makeConn({ id: "conn-1", connected: true })
    const disconnected = makeConn({ id: "conn-1", connected: false })
    useConnectionStore.setState({ connections: [conn] })
    useAppStore.setState({ currentConnection: conn })
    mockClientDisconnect.mockResolvedValueOnce(disconnected)
    await useConnectionStore.getState().toggleConnection("conn-1")
    expect(useAppStore.getState().currentConnection?.connected).toBe(false)
  })

  it("toggleConnection does not update appStore when different connection", async () => {
    const conn = makeConn({ id: "conn-1", connected: true })
    const conn2 = makeConn({ id: "conn-2", connected: true })
    const disconnected = makeConn({ id: "conn-1", connected: false })
    useConnectionStore.setState({ connections: [conn] })
    useAppStore.setState({ currentConnection: conn2 })
    mockClientDisconnect.mockResolvedValueOnce(disconnected)
    await useConnectionStore.getState().toggleConnection("conn-1")
    expect(useAppStore.getState().currentConnection?.connected).toBe(true)
  })

  it("toggleConnection sets error on failure", async () => {
    const conn = makeConn({ id: "conn-1", connected: true })
    useConnectionStore.setState({ connections: [conn] })
    mockClientDisconnect.mockRejectedValueOnce(new Error("toggle fail"))
    await expect(useConnectionStore.getState().toggleConnection("conn-1")).rejects.toThrow("toggle fail")
    expect(useConnectionStore.getState().error).toBe("toggle fail")
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

  it("updateConnection sets error on failure", async () => {
    const old = makeConn({ id: "conn-1", name: "Old" })
    useConnectionStore.setState({ connections: [old] })
    mockUpdateConnection.mockRejectedValueOnce(new Error("update fail"))
    await expect(useConnectionStore.getState().updateConnection("conn-1", "New", "sqs", {})).rejects.toThrow("update fail")
    expect(useConnectionStore.getState().error).toBe("update fail")
  })

  it("deleteConnection removes a connection from the list", async () => {
    const conn = makeConn({ id: "conn-1" })
    useConnectionStore.setState({ connections: [conn] })
    mockDeleteConnection.mockResolvedValueOnce(undefined)
    await useConnectionStore.getState().deleteConnection("conn-1")
    expect(useConnectionStore.getState().connections).toEqual([])
  })

  it("deleteConnection sets error on failure", async () => {
    const conn = makeConn({ id: "conn-1" })
    useConnectionStore.setState({ connections: [conn] })
    mockDeleteConnection.mockRejectedValueOnce(new Error("delete fail"))
    await expect(useConnectionStore.getState().deleteConnection("conn-1")).rejects.toThrow("delete fail")
    expect(useConnectionStore.getState().error).toBe("delete fail")
  })

  it("deleteConnection does not remove other connections on error", async () => {
    const conn = makeConn({ id: "conn-1" })
    useConnectionStore.setState({ connections: [conn] })
    mockDeleteConnection.mockRejectedValueOnce(new Error("fail"))
    await expect(useConnectionStore.getState().deleteConnection("conn-1")).rejects.toThrow()
    expect(useConnectionStore.getState().connections).toEqual([conn])
  })

  it("deleteConnection resets appStore when deleting current connection", async () => {
    const conn = makeConn({ id: "conn-1" })
    useConnectionStore.setState({ connections: [conn] })
    useAppStore.setState({ currentConnection: conn, activeQueue: "orders" })
    mockDeleteConnection.mockResolvedValueOnce(undefined)
    await useConnectionStore.getState().deleteConnection("conn-1")
    expect(useAppStore.getState().currentConnection).toBeNull()
    expect(useAppStore.getState().activeQueue).toBe("")
  })

  it("deleteConnection keeps appStore when deleting non-current connection", async () => {
    const conn = makeConn({ id: "conn-1" })
    const conn2 = makeConn({ id: "conn-2" })
    useConnectionStore.setState({ connections: [conn, conn2] })
    useAppStore.setState({ currentConnection: conn2, activeQueue: "orders" })
    mockDeleteConnection.mockResolvedValueOnce(undefined)
    await useConnectionStore.getState().deleteConnection("conn-1")
    expect(useAppStore.getState().currentConnection?.id).toBe("conn-2")
    expect(useAppStore.getState().activeQueue).toBe("orders")
  })

  it("sets isLoading during connect", async () => {
    let resolve: (v: unknown) => void = () => {}
    mockConnect.mockImplementationOnce(() => new Promise((r) => { resolve = r }))
    const p = useConnectionStore.getState().connect("Test", "sqs", {})
    expect(useConnectionStore.getState().isLoading).toBe(true)
    resolve(makeConn())
    await p
    expect(useConnectionStore.getState().isLoading).toBe(false)
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
    const msgs = [makeMsg({ id: "m1" })]
    mockListMessages.mockResolvedValueOnce(msgs)
    await useMessageStore.getState().loadMessages("conn-1", "q", 10)
    expect(useMessageStore.getState().messages).toEqual(msgs)
  })

  it("loadMessages sets error on failure", async () => {
    mockListMessages.mockRejectedValueOnce(new Error("load msgs fail"))
    await useMessageStore.getState().loadMessages("conn-1", "q")
    expect(useMessageStore.getState().error).toBe("load msgs fail")
  })

  it("loadMessages sets loading state", async () => {
    let resolve: (v: unknown) => void = () => {}
    mockListMessages.mockImplementationOnce(() => new Promise((r) => { resolve = r }))
    const p = useMessageStore.getState().loadMessages("conn-1", "q")
    expect(useMessageStore.getState().isLoadingMessages).toBe(true)
    resolve([])
    await p
    expect(useMessageStore.getState().isLoadingMessages).toBe(false)
  })

  it("deleteMessage removes a message from the list", async () => {
    const msgs = [makeMsg({ id: "m1" }), makeMsg({ id: "m2" })]
    useMessageStore.setState({ messages: msgs })
    mockDeleteMessage.mockResolvedValueOnce(undefined)
    await useMessageStore.getState().deleteMessage("conn-1", "q", "m1")
    expect(useMessageStore.getState().messages).toHaveLength(1)
    expect(useMessageStore.getState().messages[0].id).toBe("m2")
  })

  it("deleteMessage clears selection when deleting selected message", async () => {
    const msgs = [makeMsg({ id: "m1" }), makeMsg({ id: "m2" })]
    useMessageStore.setState({ messages: msgs, selectedMessage: msgs[0] })
    mockDeleteMessage.mockResolvedValueOnce(undefined)
    await useMessageStore.getState().deleteMessage("conn-1", "q", "m1")
    expect(useMessageStore.getState().selectedMessage).toBeNull()
  })

  it("deleteMessage keeps selection when deleting non-selected message", async () => {
    const msgs = [makeMsg({ id: "m1" }), makeMsg({ id: "m2" })]
    useMessageStore.setState({ messages: msgs, selectedMessage: msgs[1] })
    mockDeleteMessage.mockResolvedValueOnce(undefined)
    await useMessageStore.getState().deleteMessage("conn-1", "q", "m1")
    expect(useMessageStore.getState().selectedMessage?.id).toBe("m2")
  })

  it("releaseMessage removes a message from the list", async () => {
    const msgs = [makeMsg({ id: "m1" }), makeMsg({ id: "m2" })]
    useMessageStore.setState({ messages: msgs, selectedMessage: msgs[0] })
    mockReleaseMessage.mockResolvedValueOnce(undefined)
    await useMessageStore.getState().releaseMessage("conn-1", "q", "m1")
    expect(useMessageStore.getState().messages).toHaveLength(1)
    expect(useMessageStore.getState().messages[0].id).toBe("m2")
    expect(useMessageStore.getState().selectedMessage).toBeNull()
  })

  it("releaseQueue clears all messages", async () => {
    const msgs = [makeMsg({ id: "m1" }), makeMsg({ id: "m2" })]
    useMessageStore.setState({ messages: msgs, selectedMessage: msgs[0] })
    mockReleaseQueue.mockResolvedValueOnce(undefined)
    await useMessageStore.getState().releaseQueue("conn-1", "q")
    expect(useMessageStore.getState().messages).toEqual([])
    expect(useMessageStore.getState().selectedMessage).toBeNull()
  })

  it("purgeQueue clears all messages", async () => {
    const msgs = [makeMsg({ id: "m1" }), makeMsg({ id: "m2" })]
    useMessageStore.setState({ messages: msgs, selectedMessage: msgs[0] })
    mockPurgeQueue.mockResolvedValueOnce(undefined)
    await useMessageStore.getState().purgeQueue("conn-1", "q")
    expect(useMessageStore.getState().messages).toEqual([])
    expect(useMessageStore.getState().selectedMessage).toBeNull()
  })

  it("purgeQueue sets error on failure", async () => {
    useMessageStore.setState({ messages: [makeMsg()] })
    mockPurgeQueue.mockRejectedValueOnce(new Error("purge fail"))
    await useMessageStore.getState().purgeQueue("conn-1", "q")
    expect(useMessageStore.getState().error).toBe("purge fail")
    expect(useMessageStore.getState().messages).toHaveLength(1)
  })

  it("purgeQueue sets loading state", async () => {
    let resolve: (v: unknown) => void = () => {}
    mockPurgeQueue.mockImplementationOnce(() => new Promise((r) => { resolve = r }))
    const p = useMessageStore.getState().purgeQueue("conn-1", "q")
    expect(useMessageStore.getState().isLoadingMessages).toBe(true)
    resolve(undefined)
    await p
    expect(useMessageStore.getState().isLoadingMessages).toBe(false)
  })

  it("setSelectedMessage updates selected message", () => {
    const msg = makeMsg()
    useMessageStore.getState().setSelectedMessage(msg)
    expect(useMessageStore.getState().selectedMessage).toBe(msg)
  })

  it("clearMessages resets state", () => {
    useMessageStore.setState({
      messages: [makeMsg()],
      selectedMessage: makeMsg(),
      error: "some error",
    })
    useMessageStore.getState().clearMessages()
    const s = useMessageStore.getState()
    expect(s.messages).toEqual([])
    expect(s.selectedMessage).toBeNull()
    expect(s.error).toBeNull()
  })
})
