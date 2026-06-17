import { useMessageStore } from "@/stores/useMessageStore"

const headers = [
  { key: "time", label: "Time", width: "180px" },
  { key: "id", label: "Message ID", width: "1fr" },
  { key: "size", label: "Size", width: "70px" },
  { key: "payload", label: "Payload", width: "1fr" },
]

function trimPayload(payload: unknown): string {
  const text = JSON.stringify(payload)
  return text.length > 60 ? text.slice(0, 60) + "\u2026" : text
}

function MessageTable() {
  const messages = useMessageStore((s) => s.messages)
  const setSelectedMessage = useMessageStore((s) => s.setSelectedMessage)

  return (
    <div className="flex-1 min-h-0 overflow-hidden p-8">
      <div className="rounded-lg border border-border flex flex-col min-h-0 h-full overflow-hidden">
        <div
          className="grid gap-0 border-b border-border"
          style={{ gridTemplateColumns: headers.map((h) => h.width).join(" ") }}
        >
          {headers.map((h) => (
            <div key={h.key} className="text-left px-4 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              {h.label}
            </div>
          ))}
        </div>
        <div className="overflow-y-auto flex-1 min-h-0">
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => setSelectedMessage(msg)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setSelectedMessage(msg)
                }
              }}
              role="button"
              tabIndex={0}
              className="grid gap-0 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border last:border-b-0"
              style={{ gridTemplateColumns: headers.map((h) => h.width).join(" ") }}
            >
              <div className="px-4 py-2 text-xs">{msg.timestamp.toLocaleString()}</div>
              <div className="px-4 py-2 text-xs truncate">{msg.id}</div>
              <div className="px-4 py-2 text-xs">{JSON.stringify(msg.payload).length} B</div>
              <div className="px-4 py-2 text-xs truncate">{trimPayload(msg.payload)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export { MessageTable }
