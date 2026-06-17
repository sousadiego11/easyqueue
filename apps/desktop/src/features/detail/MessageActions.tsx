import { Button } from "@/components/ui/button"
import { useAppStore } from "@/stores/useAppStore"
import { useMessageStore } from "@/stores/useMessageStore"
import { queueApi } from "@/api/queueApi"
import { Play, Trash2 } from "lucide-react"
import { toast } from "sonner"

function MessageActions() {
  const selectedMessage = useMessageStore((s) => s.selectedMessage)
  const deleteMessage = useMessageStore((s) => s.deleteMessage)
  const currentConnection = useAppStore((s) => s.currentConnection)

  if (!selectedMessage) return null

  async function handleReplay() {
    if (!currentConnection) return
    try {
      await queueApi.publish(currentConnection.id, selectedMessage!.queue, selectedMessage!.payload, selectedMessage!.headers)
      toast.success("Message replayed")
    } catch {
      toast.error("Failed to replay message")
    }
  }

  async function handleDelete() {
    if (!currentConnection) return
    try {
      await deleteMessage(currentConnection.id, selectedMessage!.queue, selectedMessage!.id)
      toast.success("Message deleted")
    } catch {
      toast.error("Failed to delete message")
    }
  }

  return (
    <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-4">Actions</span>
      <div className="flex gap-2">
        <Button variant="default" size="sm" onClick={handleReplay} className="px-4">
          <Play className="h-3.5 w-3.5" /> Replay
        </Button>
        <Button variant="outline" size="sm" onClick={handleDelete} className="border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </div>
  )
}

export { MessageActions }
