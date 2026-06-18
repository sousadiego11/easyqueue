import { useState, useMemo } from "react"
import { useMessageStore } from "@/stores/useMessageStore"
import { Inbox, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

type SortField = "time" | "id" | "size"
type SortDir = "asc" | "desc"

const headers = [
  { key: "time", label: "Time", width: "180px", sortable: true },
  { key: "id", label: "Message ID", width: "1fr", sortable: true },
  { key: "size", label: "Size", width: "70px", sortable: true },
  { key: "payload", label: "Payload", width: "1fr", sortable: false },
] as const

function trimPayload(payload: unknown): string {
  const text = JSON.stringify(payload)
  return text.length > 60 ? text.slice(0, 60) + "\u2026" : text
}

function getMessageSize(msg: { payload: unknown }): number {
  return JSON.stringify(msg.payload).length
}

function SortIcon({ field, active, direction }: { field: SortField; active: SortField; direction: SortDir }) {
  if (field !== active) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />
  return direction === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
}

function MessageTable() {
  const messages = useMessageStore((s) => s.messages)
  const setSelectedMessage = useMessageStore((s) => s.setSelectedMessage)

  const [sortField, setSortField] = useState<SortField>("time")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [timeFilter, setTimeFilter] = useState("")
  const [idFilter, setIdFilter] = useState("")
  const [payloadFilter, setPayloadFilter] = useState("")

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir(field === "time" ? "desc" : "asc")
    }
  }

  const filtered = useMemo(() => {
    let result = [...messages]

    if (timeFilter) {
      const q = timeFilter.toLowerCase()
      result = result.filter((m) => m.timestamp.toLocaleString().toLowerCase().includes(q))
    }
    if (idFilter) {
      const q = idFilter.toLowerCase()
      result = result.filter((m) => m.id.toLowerCase().includes(q))
    }
    if (payloadFilter) {
      const q = payloadFilter.toLowerCase()
      result = result.filter((m) => JSON.stringify(m.payload).toLowerCase().includes(q))
    }

    result.sort((a, b) => {
      let cmp = 0
      if (sortField === "time") {
        cmp = a.timestamp.getTime() - b.timestamp.getTime()
      } else if (sortField === "id") {
        cmp = a.id.localeCompare(b.id)
      } else {
        cmp = getMessageSize(a) - getMessageSize(b)
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [messages, sortField, sortDir, timeFilter, idFilter, payloadFilter])

  return (
    <div className="flex-1 min-h-0 overflow-hidden p-8">
      <div className="rounded-lg border border-border flex flex-col min-h-0 h-full overflow-hidden">
        <div
          className="grid gap-0 border-b border-border bg-muted/30"
          style={{ gridTemplateColumns: headers.map((h) => h.width).join(" ") }}
        >
          <div className="px-4 py-1.5">
            <input
              type="text"
              placeholder="Filter time..."
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
            />
          </div>
          <div className="px-4 py-1.5">
            <input
              type="text"
              placeholder="Filter ID..."
              value={idFilter}
              onChange={(e) => setIdFilter(e.target.value)}
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
            />
          </div>
          <div className="px-4 py-1.5" />
          <div className="px-4 py-1.5">
            <input
              type="text"
              placeholder="Filter payload..."
              value={payloadFilter}
              onChange={(e) => setPayloadFilter(e.target.value)}
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        <div
          className="grid gap-0 border-b border-border"
          style={{ gridTemplateColumns: headers.map((h) => h.width).join(" ") }}
        >
          {headers.map((h) => (
            <div
              key={h.key}
              onClick={h.sortable ? () => toggleSort(h.key as SortField) : undefined}
              className={`flex items-center px-4 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wider ${h.sortable ? "cursor-pointer select-none hover:text-foreground" : ""}`}
            >
              {h.label}
              {h.sortable && <SortIcon field={h.key as SortField} active={sortField} direction={sortDir} />}
            </div>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 h-full text-muted-foreground">
              <Inbox className="h-12 w-12" />
              <span className="text-sm">No messages</span>
              <span className="text-xs">Consume a queue to see messages</span>
            </div>
          ) : (
            filtered.map((msg) => (
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
                <div className="px-4 py-2 text-xs">{getMessageSize(msg)} B</div>
                <div className="px-4 py-2 text-xs truncate">{trimPayload(msg.payload)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export { MessageTable }
