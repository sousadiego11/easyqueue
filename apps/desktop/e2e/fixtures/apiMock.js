window.__connections = []
window.__queues = [
  { name: "orders" },
  { name: "payments" },
  { name: "notifications" },
]
window.__messages = {}
window.__msgCounter = 0
window.__connected = new Set()

window.queueApi = {
  async connect(name, provider, config) {
    const id = crypto.randomUUID()
    const conn = { id, name, provider, connected: true, config }
    window.__connections.push(conn)
    window.__connected.add(id)
    window.__messages[id] = {}
    return conn
  },

  async disconnect(connectionId) {
    window.__connections = window.__connections.filter((c) => c.id !== connectionId)
    window.__connected.delete(connectionId)
    delete window.__messages[connectionId]
  },

  async listConnections() {
    return window.__connections
  },

  async updateConnection(oldId, name, provider, config) {
    const conn = window.__connections.find((c) => c.id === oldId)
    if (!conn) throw new Error("Not found")
    conn.name = name
    conn.provider = provider
    conn.config = config
    window.__connections = window.__connections.filter((c) => c.id !== oldId)
    const updated = { ...conn, id: crypto.randomUUID() }
    window.__connections.push(updated)
    return updated
  },

  async clientConnect(connectionId) {
    window.__connected.add(connectionId)
    const c = window.__connections.find((c) => c.id === connectionId)
    if (c) c.connected = true
    return { ...c }
  },

  async clientDisconnect(connectionId) {
    window.__connected.delete(connectionId)
    const c = window.__connections.find((c) => c.id === connectionId)
    if (c) c.connected = false
    return { ...c }
  },

  async listQueues(connectionId) {
    return window.__queues
  },

  async listMessages(connectionId, queue, limit) {
    const msgs = (window.__messages[connectionId]?.[queue] ?? []).slice(0, limit ?? 100)
    return msgs
  },

  async publish(connectionId, queue, payload, headers) {
    if (!window.__messages[connectionId]) window.__messages[connectionId] = {}
    if (!window.__messages[connectionId][queue]) window.__messages[connectionId][queue] = []
    window.__msgCounter++
    const msg = {
      id: `msg-${window.__msgCounter}`,
      queue,
      payload,
      timestamp: new Date(),
      headers,
    }
    window.__messages[connectionId][queue].push(msg)
  },

  async deleteMessage(connectionId, queue, messageId) {
    const msgs = window.__messages[connectionId]?.[queue] ?? []
    window.__messages[connectionId][queue] = msgs.filter((m) => m.id !== messageId)
  },

  async releaseMessage(connectionId, queue, messageId) {
    const msgs = window.__messages[connectionId]?.[queue] ?? []
    window.__messages[connectionId][queue] = msgs.filter((m) => m.id !== messageId)
  },

  async releaseQueue(connectionId, queue) {
    if (window.__messages[connectionId]) {
      window.__messages[connectionId][queue] = []
    }
  },

  async purgeQueue(connectionId, queue) {
    if (window.__messages[connectionId]) {
      window.__messages[connectionId][queue] = []
    }
  },

  async deleteConnection(connectionId) {
    window.__connections = window.__connections.filter((c) => c.id !== connectionId)
    window.__connected.delete(connectionId)
    delete window.__messages[connectionId]
  },

  minimize() {},
  maximize() {},
  close() {},
}
