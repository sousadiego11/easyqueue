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

  setSelectedMessage: (message) => set({ selectedMessage: message }),
  clearMessages: () => set({ messages: [], selectedMessage: null, error: null }),
}))