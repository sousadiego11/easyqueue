import { create } from "zustand"
import type { ConnectionInfo } from "@/api/queueApi"
import type { Provider } from "@easyqueue/core"
import { queueApi } from "@/api/queueApi"

interface ConnectionStore {
  connections: ConnectionInfo[]
  isLoading: boolean
  error: string | null

  connect: (name: string, provider: Provider, config: Record<string, unknown>) => Promise<ConnectionInfo>
  disconnect: (id: string) => Promise<void>
  loadConnections: () => Promise<ConnectionInfo[]>
  updateConnection: (id: string, name: string, provider: Provider, config: Record<string, unknown>) => Promise<ConnectionInfo>
  toggleConnection: (id: string) => Promise<ConnectionInfo>
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  connections: [],
  isLoading: false,
  error: null,

  connect: async (name, provider, config) => {
    set({ isLoading: true, error: null })
    try {
      const connection = await queueApi.connect(name, provider, config)
      set((s) => ({ connections: [...s.connections, connection], isLoading: false }))
      return connection
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect"
      set({ error: message, isLoading: false })
      throw err
    }
  },

  disconnect: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await queueApi.disconnect(id)
      set((s) => ({ connections: s.connections.filter((c) => c.id !== id), isLoading: false }))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disconnect"
      set({ error: message, isLoading: false })
      throw err
    }
  },

  loadConnections: async () => {
    set({ isLoading: true, error: null })
    try {
      const connections = await queueApi.listConnections()
      set({ connections, isLoading: false })
      return connections
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load connections"
      set({ error: message, isLoading: false })
      throw err
    }
  },

  updateConnection: async (oldId, name, provider, config) => {
    set({ isLoading: true, error: null })
    try {
      const connection = await queueApi.updateConnection(oldId, name, provider, config)
      set((s) => ({
        connections: [...s.connections.filter((c) => c.id !== oldId), connection],
        isLoading: false,
      }))
      return connection
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update connection"
      set({ error: message, isLoading: false })
      throw err
    }
  },

  toggleConnection: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { connections } = get()
      const connection = connections.find((c) => c.id === id)
      if (!connection) throw new Error("Connection not found")

      const updated = connection.connected
        ? await queueApi.clientDisconnect(id)
        : await queueApi.clientConnect(id)

      set((s) => ({
        connections: s.connections.map((c) => (c.id === id ? updated : c)),
        isLoading: false,
      }))
      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to toggle connection"
      set({ error: message, isLoading: false })
      throw err
    }
  },
}))
