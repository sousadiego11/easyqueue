import { queueApi } from "@/api/queueApi"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/stores/useAppStore"
import { RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"


function QueueList() {
  const activeQueue = useAppStore((s) => s.activeQueue)
  const setActiveQueue = useAppStore((s) => s.setActiveQueue)
  const currentConnection = useAppStore((s) => s.currentConnection)
  const [queues, setQueues] = useState<string[]>([])

  const loadQueues = useCallback(async () => {
    if (!currentConnection) {
      setQueues([])
      return
    }

    try {
      const result = await queueApi.listQueues(currentConnection.id)
      setQueues(result)
      toast.success("Queues refreshed")
    } catch {
      toast.error("Failed to refresh queues")
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
        <Button variant="ghost" size="icon" aria-label="Refresh queues" className="text-sidebar-foreground/60" onClick={loadQueues}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex flex-col gap-0.5">
        {queues.map((q) => (
          <button
            key={q}
            onClick={() => setActiveQueue(q)}
            data-active={q === activeQueue ? "true" : undefined}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm cursor-pointer text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-left data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
          >
            <span className="truncate flex-1">{q}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
export { QueueList }

