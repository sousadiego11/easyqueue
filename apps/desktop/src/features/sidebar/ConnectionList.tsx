import { Button } from "@/components/ui/button"
import { StatusDot } from "@/components/ui/StatusDot"
import { EmptyState } from "@/components/ui/EmptyState"
import { useAppStore } from "@/stores/useAppStore"
import { useConnectionStore } from "@/stores/useConnectionStore"
import { Plug, Plus, Pencil, Power, PowerOff } from "lucide-react"
import sqsIcon from "@/icons/SQS.svg"
import rabbitIcon from "@/icons/RABBIT.svg"
import redisIcon from "@/icons/REDIS.svg"
import azureIcon from "@/icons/AZURE.svg"
import type { Provider } from "@easyqueue/core"

const providerIcon: Record<Provider, string> = {
  sqs: sqsIcon,
  rabbitmq: rabbitIcon,
  redis: redisIcon,
  azureservicebus: azureIcon,
}

function providerIconSrc(provider: string): string {
  return providerIcon[provider as Provider] ?? rabbitIcon
}

function ConnectionList() {
  const connections = useConnectionStore((s) => s.connections)
  const toggleConnection = useConnectionStore((s) => s.toggleConnection)
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
          <EmptyState icon={Plug} message="No connections" />
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
              <button
                onClick={(e) => { e.stopPropagation(); toggleConnection(c.id) }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-foreground"
                aria-label={c.connected ? `Disconnect ${c.name}` : `Connect ${c.name}`}
              >
                {c.connected ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
              </button>
              <StatusDot active={c.connected} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
export { ConnectionList }
