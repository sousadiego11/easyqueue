import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"

const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
}
const classListMock = { toggle: vi.fn() }
const documentMock = {
  documentElement: { classList: classListMock },
}

vi.stubGlobal("localStorage", localStorageMock)
vi.stubGlobal("document", documentMock)

const mockClearMessages = vi.fn()

vi.mock("@/stores/useMessageStore", () => ({
  useMessageStore: { getState: () => ({ clearMessages: mockClearMessages }) },
}))

vi.mock("@/api/queueApi", () => ({
  queueApi: {
    connect: vi.fn(), disconnect: vi.fn(), listConnections: vi.fn(),
    updateConnection: vi.fn(), clientConnect: vi.fn(), clientDisconnect: vi.fn(),
    listMessages: vi.fn(), publish: vi.fn(), deleteMessage: vi.fn(),
    releaseMessage: vi.fn(), releaseQueue: vi.fn(), purgeQueue: vi.fn(),
    minimize: vi.fn(), maximize: vi.fn(), close: vi.fn(),
  },
}))

describe("useAppStore", () => {
  let useAppStore: typeof import("@/stores/useAppStore")["useAppStore"]

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    useAppStore = (await import("@/stores/useAppStore")).useAppStore
  })

  afterEach(() => {
    useAppStore.setState({
      theme: "dark",
      currentConnection: null,
      activeQueue: "",
      selectedMessageId: null,
      activeTab: "messages",
      isNewConnectionModalOpen: false,
      editingConnectionId: null,
    })
  })

  it("starts with dark theme", () => {
    expect(useAppStore.getState().theme).toBe("dark")
  })

  it("toggleTheme switches from dark to light", () => {
    useAppStore.setState({ theme: "dark" })
    useAppStore.getState().toggleTheme()
    expect(useAppStore.getState().theme).toBe("light")
    expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "light")
    expect(classListMock.toggle).toHaveBeenCalledWith("dark", false)
  })

  it("toggleTheme switches from light to dark", () => {
    useAppStore.setState({ theme: "light" })
    useAppStore.getState().toggleTheme()
    expect(useAppStore.getState().theme).toBe("dark")
    expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "dark")
    expect(classListMock.toggle).toHaveBeenCalledWith("dark", true)
  })

  it("setCurrentConnection updates current connection", () => {
    const conn = { id: "c1", name: "Test", provider: "sqs" as const, connected: true, config: {} }
    useAppStore.getState().setCurrentConnection(conn)
    expect(useAppStore.getState().currentConnection).toEqual(conn)
  })

  it("setCurrentConnection accepts null", () => {
    useAppStore.setState({ currentConnection: { id: "c1", name: "T", provider: "sqs", connected: true, config: {} } })
    useAppStore.getState().setCurrentConnection(null)
    expect(useAppStore.getState().currentConnection).toBeNull()
  })

  it("setCurrentConnection resets activeQueue and selectedMessageId", () => {
    useAppStore.setState({ activeQueue: "orders", selectedMessageId: "msg-1" })
    useAppStore.getState().setCurrentConnection({ id: "c2", name: "Other", provider: "sqs", connected: true, config: {} })
    expect(useAppStore.getState().activeQueue).toBe("")
    expect(useAppStore.getState().selectedMessageId).toBeNull()
  })

  it("setCurrentConnection calls clearMessages", () => {
    useAppStore.getState().setCurrentConnection({ id: "c1", name: "Test", provider: "sqs", connected: true, config: {} })
    expect(mockClearMessages).toHaveBeenCalled()
  })

  it("setActiveQueue sets queue and calls clearMessages", () => {
    useAppStore.getState().setActiveQueue("orders")
    expect(useAppStore.getState().activeQueue).toBe("orders")
    expect(mockClearMessages).toHaveBeenCalledTimes(1)
  })

  it("setSelectedMessageId updates the id", () => {
    expect(useAppStore.getState().selectedMessageId).toBeNull()
    useAppStore.getState().setSelectedMessageId("msg-1")
    expect(useAppStore.getState().selectedMessageId).toBe("msg-1")
    useAppStore.getState().setSelectedMessageId(null)
    expect(useAppStore.getState().selectedMessageId).toBeNull()
  })

  it("setActiveTab updates the tab", () => {
    useAppStore.getState().setActiveTab("publisher")
    expect(useAppStore.getState().activeTab).toBe("publisher")
  })

  it("openNewConnectionModal sets modal open", () => {
    useAppStore.getState().openNewConnectionModal()
    expect(useAppStore.getState().isNewConnectionModalOpen).toBe(true)
  })

  it("closeNewConnectionModal closes modal and clears editingConnectionId", () => {
    useAppStore.setState({ isNewConnectionModalOpen: true, editingConnectionId: "c1" })
    useAppStore.getState().closeNewConnectionModal()
    expect(useAppStore.getState().isNewConnectionModalOpen).toBe(false)
    expect(useAppStore.getState().editingConnectionId).toBeNull()
  })

  it("openEditConnectionModal sets editingConnectionId", () => {
    useAppStore.getState().openEditConnectionModal("c1")
    expect(useAppStore.getState().editingConnectionId).toBe("c1")
  })

  it("closeEditConnectionModal clears editingConnectionId", () => {
    useAppStore.setState({ editingConnectionId: "c1" })
    useAppStore.getState().closeEditConnectionModal()
    expect(useAppStore.getState().editingConnectionId).toBeNull()
  })
})
