import type { QueueInfo } from "@easyqueue/core"
import { queueApi } from "@/api/queueApi"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/stores/useAppStore"
import { FolderOpen, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"


function QueueList() {
  const activeQueue = useAppStore((s) => s.activeQueue)
  const setActiveQueue = useAppStore((s) => s.setActiveQueue)
  const currentConnection = useAppStore((s) => s.currentConnection)
  const [queues, setQueues] = useState<QueueInfo[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadQueues = useCallback(async () => {
    if (!currentConnection || !currentConnection.connected) {
      setQueues([])
      return
    }

    setIsRefreshing(true)
    try {
      const result = await queueApi.listQueues(currentConnection.id)
      setQueues(result)
      toast.success("Queues refreshed")
    } catch {
      toast.error("Failed to refresh queues")
      setQueues([])
    } finally {
      setIsRefreshing(false)
    }
  }, [currentConnection])

  useEffect(() => {
    loadQueues()
  }, [loadQueues])

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.75rem] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          QUEUES
        </span>
        <Button variant="ghost" size="icon" aria-label="Refresh queues" className="text-sidebar-foreground/60" onClick={loadQueues} loading={isRefreshing} disabled={!currentConnection}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex flex-col gap-0.5">
        {queues.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-sidebar-foreground/40">
            <FolderOpen className="h-8 w-8" />
            <span className="text-xs">No queues</span>
          </div>
        ) : (
          queues.map((q) => (
            <button
              key={q.name}
              onClick={() => setActiveQueue(q.name)}
              data-active={q.name === activeQueue ? "true" : undefined}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm cursor-pointer text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-left data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
            >
              <span className="truncate flex-1">{q.name}</span>
              {q.visibilityTimeoutSeconds !== undefined && (
                <span className="text-[0.65rem] text-muted-foreground/50 tabular-nums">
                  {q.visibilityTimeoutSeconds}s
                </span>
              )}
              {q.delaySeconds !== undefined && q.delaySeconds > 0 && (
                <span className="text-[0.65rem] text-muted-foreground/50 tabular-nums">
                  delay {q.delaySeconds}s
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
export { QueueList }

