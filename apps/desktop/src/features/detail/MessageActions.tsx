import { Button } from "@/components/ui/button"
import { useAppStore } from "@/stores/useAppStore"
import { useMessageStore } from "@/stores/useMessageStore"
import { queueApi } from "@/api/queueApi"
import { Play, Trash2, Undo2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

function MessageActions() {
  const selectedMessage = useMessageStore((s) => s.selectedMessage)
  const deleteMessage = useMessageStore((s) => s.deleteMessage)
  const releaseMessage = useMessageStore((s) => s.releaseMessage)
  const currentConnection = useAppStore((s) => s.currentConnection)
  const [isReplaying, setIsReplaying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)

  if (!selectedMessage) return null

  async function handleReplay() {
    if (!currentConnection) return
    setIsReplaying(true)
    try {
      await queueApi.publish(currentConnection.id, selectedMessage!.queue, selectedMessage!.payload, selectedMessage!.headers)
      toast.success("Message replayed")
    } catch {
      toast.error("Failed to replay message")
    } finally {
      setIsReplaying(false)
    }
  }

  async function handleDelete() {
    if (!currentConnection) return
    setIsDeleting(true)
    try {
      await deleteMessage(currentConnection.id, selectedMessage!.queue, selectedMessage!.id)
      toast.success("Message deleted")
    } catch {
      toast.error("Failed to delete message")
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleRelease() {
    if (!currentConnection) return
    setIsReleasing(true)
    try {
      await releaseMessage(currentConnection.id, selectedMessage!.queue, selectedMessage!.id)
      toast.success("Message released")
    } catch {
      toast.error("Failed to release message")
    } finally {
      setIsReleasing(false)
    }
  }

  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-4">Actions</span>
      <div className="flex gap-2">
        <Button variant="default" size="sm" onClick={handleReplay}
          loading={isReplaying} disabled={!currentConnection?.connected} className="px-4">
          <Play className="h-3.5 w-3.5" /> Replay
        </Button>
        <Button variant="secondary" size="sm" onClick={handleRelease}
          loading={isReleasing} disabled={!currentConnection?.connected} className="px-4">
          <Undo2 className="h-3.5 w-3.5" /> Release
        </Button>
        <Button variant="outline" size="sm" onClick={handleDelete}
          loading={isDeleting} disabled={!currentConnection?.connected} className="border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </div>
  )
}

export { MessageActions }
