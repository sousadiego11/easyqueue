import { create } from "zustand"
import type { ConnectionInfo } from "@/api/queueApi"
import { useMessageStore } from "./useMessageStore"

interface AppStore {
  theme: "light" | "dark"
  toggleTheme: () => void
  activeQueue: string
  setActiveQueue: (q: string) => void
  selectedMessageId: string | null
  setSelectedMessageId: (id: string | null) => void
  activeTab: string
  setActiveTab: (t: string) => void
  isNewConnectionModalOpen: boolean
  openNewConnectionModal: () => void
  closeNewConnectionModal: () => void
  editingConnectionId: string | null
  openEditConnectionModal: (id: string) => void
  closeEditConnectionModal: () => void
  currentConnection: ConnectionInfo | null
  setCurrentConnection: (conn: ConnectionInfo | null) => void
}

const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null
const initialTheme: "light" | "dark" = stored === "light" || stored === "dark" ? stored : "dark"

export const useAppStore = create<AppStore>((set) => ({
  theme: initialTheme,
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "dark" ? "light" : "dark"
      document.documentElement.classList.toggle("dark", next === "dark")
      localStorage.setItem("theme", next)
      return { theme: next }
    }),

  currentConnection: null,
  setCurrentConnection: (conn) => set({ currentConnection: conn }),

  activeQueue: "",
  setActiveQueue: (q) => {
    set({ activeQueue: q })
    useMessageStore.getState().clearMessages()
  },

  selectedMessageId: null,
  setSelectedMessageId: (id) => set({ selectedMessageId: id }),

  activeTab: "messages",
  setActiveTab: (t) => set({ activeTab: t }),

  isNewConnectionModalOpen: false,
  openNewConnectionModal: () => set({ isNewConnectionModalOpen: true }),
  closeNewConnectionModal: () => set({ isNewConnectionModalOpen: false, editingConnectionId: null }),

  editingConnectionId: null,
  openEditConnectionModal: (id) => set({ editingConnectionId: id }),
  closeEditConnectionModal: () => set({ editingConnectionId: null }),
}))
