import { create } from "zustand"
import type { QueueMessage } from "@easyqueue/core"
import { queueApi } from "@/api/queueApi"

interface MessageStore {
  messages: QueueMessage[]
  selectedMessage: QueueMessage | null
  isLoadingMessages: boolean
  error: string | null

  loadMessages: (connectionId: string, queue: string, limit?: number) => Promise<void>
  deleteMessage: (connectionId: string, queue: string, messageId: string) => Promise<void>
  releaseMessage: (connectionId: string, queue: string, messageId: string) => Promise<void>
  releaseQueue: (connectionId: string, queue: string) => Promise<void>
  purgeQueue: (connectionId: string, queue: string) => Promise<void>
  setSelectedMessage: (message: QueueMessage | null) => void
  clearMessages: () => void
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  selectedMessage: null,
  isLoadingMessages: false,
  error: null,

  loadMessages: async (connectionId, queue, limit) => {
    set({ isLoadingMessages: true, error: null })
    try {
      const messages = await queueApi.listMessages(connectionId, queue, limit)
      set({ messages, isLoadingMessages: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load messages"
      set({ error: message, isLoadingMessages: false })
      throw err
    }
  },

  deleteMessage: async (connectionId, queue, messageId) => {
    await queueApi.deleteMessage(connectionId, queue, messageId)
    const selected = get().selectedMessage
    set((s) => ({
      messages: s.messages.filter((m) => m.id !== messageId),
      selectedMessage: selected?.id === messageId ? null : selected,
    }))
  },

  releaseMessage: async (connectionId, queue, messageId) => {
    await queueApi.releaseMessage(connectionId, queue, messageId)
    const selected = get().selectedMessage
    set((s) => ({
      messages: s.messages.filter((m) => m.id !== messageId),
      selectedMessage: selected?.id === messageId ? null : selected,
    }))
  },

  releaseQueue: async (connectionId, queue) => {
    await queueApi.releaseQueue(connectionId, queue)
    set({ messages: [], selectedMessage: null })
  },

  purgeQueue: async (connectionId, queue) => {
    set({ isLoadingMessages: true, error: null })
    try {
      await queueApi.purgeQueue(connectionId, queue)
      set({ messages: [], selectedMessage: null, isLoadingMessages: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to purge queue"
      set({ error: message, isLoadingMessages: false })
    }
  },

  setSelectedMessage: (message) => set({ selectedMessage: message }),
  clearMessages: () => set({ messages: [], selectedMessage: null, error: null }),
}))