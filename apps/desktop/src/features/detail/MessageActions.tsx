import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
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
  const [isReleasing, setIsReleasing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  if (!selectedMessage) return null

  const msg = selectedMessage

  async function handleReplay() {
    if (!currentConnection) return
    setIsReplaying(true)
    try {
      await queueApi.publish(currentConnection.id, msg.queue, msg.payload, msg.headers)
      toast.success("Message replayed")
    } catch {
      toast.error("Failed to replay message")
    } finally {
      setIsReplaying(false)
    }
  }

  async function handleRelease() {
    if (!currentConnection) return
    setIsReleasing(true)
    try {
      await releaseMessage(currentConnection.id, msg.queue, msg.id)
      toast.success("Message released")
    } catch {
      toast.error("Failed to release message")
    } finally {
      setIsReleasing(false)
    }
  }

  async function handleDelete() {
    if (!currentConnection) return
    setIsDeleting(true)
    try {
      await deleteMessage(currentConnection.id, msg.queue, msg.id)
      toast.success("Message deleted")
      setShowDeleteDialog(false)
    } catch {
      toast.error("Failed to delete message")
    } finally {
      setIsDeleting(false)
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
        <Button variant="destructiveOutline" size="sm" onClick={() => setShowDeleteDialog(true)}
          disabled={!currentConnection?.connected} className="px-4">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Message"
        description={
          <>
            Are you sure you want to delete this message? It will be permanently removed from <strong>{msg.queue}</strong>.
          </>
        }
        actionLabel="Delete"
        onConfirm={handleDelete}
        loading={isDeleting}
        icon={Trash2}
      />
    </div>
  )
}

export { MessageActions }
