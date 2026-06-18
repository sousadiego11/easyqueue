import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Trash2 } from "lucide-react"
import { MessageTable } from "@/features/messages/MessageTable"
import { useAppStore } from "@/stores/useAppStore"
import { useMessageStore } from "@/stores/useMessageStore"
import { toast } from "sonner"

function ContentArea() {
  const [limit, setLimit] = useState(100)
  const activeQueue = useAppStore((s) => s.activeQueue)
  const currentConnection = useAppStore((s) => s.currentConnection)
  const loadMessages = useMessageStore((s) => s.loadMessages)
  const purgeQueue = useMessageStore((s) => s.purgeQueue)
  const isLoadingMessages = useMessageStore((s) => s.isLoadingMessages)

  async function handleConsume() {
    if (!currentConnection || !activeQueue) return
    try {
      await loadMessages(currentConnection.id, activeQueue, limit)
      toast.success("Messages loaded")
    } catch {
      toast.error("Failed to load messages")
    }
  }

  async function handlePurge() {
    if (!currentConnection || !activeQueue) return
    try {
      await purgeQueue(currentConnection.id, activeQueue)
      toast.success("Queue purged")
    } catch {
      toast.error("Failed to purge queue")
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card">
      <div className="flex items-center gap-2 px-4 h-14 border-b bg-card flex-shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Messages
        </span>
        <div className="flex-1" />
        <Input
          type="number"
          min={1}
          max={100}
          value={limit}
          onChange={(e) => setLimit(Math.min(100, Math.max(1, Number(e.target.value))))}
          className="w-20 h-7 text-xs"
        />
        <Button size="sm" onClick={handleConsume} loading={isLoadingMessages} disabled={!currentConnection?.connected}>
          <Download className="h-3.5 w-3.5 mr-1" />
          Consume
        </Button>
        <Button variant="outline" size="sm" onClick={handlePurge} loading={isLoadingMessages} disabled={!currentConnection?.connected} className="border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4">
          <Trash2 className="h-3.5 w-3.5" /> Purge
        </Button>
      </div>
      <MessageTable />
    </div>
  )
}

export { ContentArea }
