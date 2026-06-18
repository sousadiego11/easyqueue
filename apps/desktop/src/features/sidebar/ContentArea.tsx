import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download } from "lucide-react"
import { MessageTable } from "@/features/messages/MessageTable"
import { useAppStore } from "@/stores/useAppStore"
import { useMessageStore } from "@/stores/useMessageStore"
import { toast } from "sonner"

function ContentArea() {
  const [limit, setLimit] = useState(100)
  const activeQueue = useAppStore((s) => s.activeQueue)
  const currentConnection = useAppStore((s) => s.currentConnection)
  const loadMessages = useMessageStore((s) => s.loadMessages)
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
      </div>
      <MessageTable />
    </div>
  )
}

export { ContentArea }
