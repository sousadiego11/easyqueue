import { Button } from "@/components/ui/button"
import { useAppStore } from "@/stores/useAppStore"
import { useConnectionStore } from "@/stores/useConnectionStore"
import { Plug, Plus, Pencil } from "lucide-react"
import sqsIcon from "@/icons/SQS.svg"
import rabbitIcon from "@/icons/RABBIT.svg"

function providerIconSrc(provider: string): string {
  if (provider === "sqs") return sqsIcon
  return rabbitIcon
}

function ConnectionList() {
  const connections = useConnectionStore((s) => s.connections)
  const currentConnection = useAppStore((s) => s.currentConnection)
  const setCurrentConnection = useAppStore((s) => s.setCurrentConnection)
  const openNewConnectionModal = useAppStore((s) => s.openNewConnectionModal)
  const openEditConnectionModal = useAppStore((s) => s.openEditConnectionModal)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.75rem] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          CONNECTIONS
        </span>
        <Button variant="ghost" size="icon" aria-label="New connection" onClick={openNewConnectionModal} className="text-sidebar-foreground/60">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex flex-col gap-0.5">
        {connections.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-sidebar-foreground/40">
            <Plug className="h-8 w-8" />
            <span className="text-xs">No connections</span>
          </div>
        ) : (
          connections.map((c) => (
            <div
              key={c.id}
              data-active={c.id === currentConnection?.id ? "true" : undefined}
              className="group flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm cursor-pointer text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
              onClick={() => setCurrentConnection(c)}
            >
              <img src={providerIconSrc(c.provider)} alt="" className="w-4 h-4" />
              <span className="truncate flex-1 text-left">{c.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); openEditConnectionModal(c.id) }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-foreground"
                aria-label={`Edit ${c.name}`}
              >
                <Pencil className="h-3 w-3" />
              </button>
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${c.connected ? "bg-[#22c55e]" : "bg-[#f87171]"
                  }`}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
export { ConnectionList }
