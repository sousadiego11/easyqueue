import { Button } from "@/components/ui/button"
import { JsonEditor } from "@/components/ui/JsonEditor"
import { MessageActions } from "@/features/detail/MessageActions"
import { MessageMeta } from "@/features/detail/MessageMeta"
import { useAppStore } from "@/stores/useAppStore"
import { useMessageStore } from "@/stores/useMessageStore"
import { Copy, X } from "lucide-react"

function DetailPanel() {
  const msg = useMessageStore((s) => s.selectedMessage)
  const setSelectedMessage = useMessageStore((s) => s.setSelectedMessage)
  const theme = useAppStore((s) => s.theme)

  if (!msg) return null

  return (
    <aside className="w-full h-full flex flex-col border-l bg-card">
      <div className="flex items-center justify-between px-4 h-14 border-b bg-card flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-shrink-0">Message Id: </span>
          <span className="text-sm truncate">{msg.id}</span>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close detail panel" onClick={() => setSelectedMessage(null)} className="text-muted-foreground">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</span>

        <MessageMeta msg={msg} />

        <MessageActions />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payload</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground" aria-label="Copy Payload"><Copy className="h-3 w-3" /></Button>
          </div>
          <JsonEditor
            dark={theme === "dark"}
            content={{ json: msg.payload }}
            onChange={() => { }}
            readOnly
          />
        </div>

        {!!msg.raw && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raw</span>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground" aria-label="Copy Raw"><Copy className="h-3 w-3" /></Button>
            </div>
            <JsonEditor
              dark={theme === "dark"}
              content={{ json: msg.raw }}
              onChange={() => { }}
              readOnly
            />
          </div>
        )}
      </div>
    </aside>
  )
}

export { DetailPanel }
