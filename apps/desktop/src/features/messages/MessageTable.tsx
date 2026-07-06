import { useState, useMemo } from "react"
import { useMessageStore } from "@/stores/useMessageStore"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Inbox, Loader2 } from "lucide-react"
import { trimPayload, getMessageSize, formatSize } from "@/lib/messageUtils"

type SortField = "time" | "id" | "size"
type SortDir = "asc" | "desc"

const headers = [
  { key: "time", label: "Time", width: "170px", sortable: true, align: "left" as const },
  { key: "id", label: "Message ID", width: "1.2fr", sortable: true, align: "left" as const },
  { key: "attributes", label: "", width: "36px", sortable: false, align: "center" as const },
  { key: "payload", label: "Payload", width: "1.5fr", sortable: false, align: "left" as const },
  { key: "size", label: "Size", width: "70px", sortable: true, align: "right" as const },
] as const

function SortIcon({ field, active, direction }: { field: SortField; active: SortField; direction: SortDir }) {
  if (field !== active) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />
  return direction === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
}

function FilterInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent pl-7 pr-2 py-1.5 text-xs outline-none placeholder:text-muted-foreground/40"
      />
    </div>
  )
}

function MessageTable() {
  const messages = useMessageStore((s) => s.messages)
  const selectedMessage = useMessageStore((s) => s.selectedMessage)
  const setSelectedMessage = useMessageStore((s) => s.setSelectedMessage)
  const isLoading = useMessageStore((s) => s.isLoadingMessages)
  const error = useMessageStore((s) => s.error)

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
      <div className="rounded-lg border border-border flex flex-col min-h-0 h-full overflow-hidden bg-card">
        <div
          className="grid gap-0 border-b border-border bg-muted/30"
          style={{ gridTemplateColumns: headers.map((h) => h.width).join(" ") }}
        >
          {headers.map((h) => (
            <div key={h.key} className="px-2 py-1">
              {h.key === "time" && <FilterInput placeholder="Filter time..." value={timeFilter} onChange={setTimeFilter} />}
              {h.key === "id" && <FilterInput placeholder="Filter ID..." value={idFilter} onChange={setIdFilter} />}
              {h.key === "attributes" && null}
              {h.key === "size" && null}
              {h.key === "payload" && <FilterInput placeholder="Filter payload..." value={payloadFilter} onChange={setPayloadFilter} />}
            </div>
          ))}
        </div>

        <div
          className="grid gap-0 border-b border-border bg-muted/20 text-muted-foreground text-xs uppercase tracking-wider"
          style={{ gridTemplateColumns: headers.map((h) => h.width).join(" ") }}
        >
          {headers.map((h) => (
            <div
              key={h.key}
              onClick={h.sortable ? () => toggleSort(h.key as SortField) : undefined}
              className={`flex items-center px-4 py-2 font-semibold ${h.align === "right" ? "justify-end" : ""} ${h.sortable ? "cursor-pointer select-none hover:text-foreground" : ""}`}
            >
              {h.label}
              {h.sortable && <SortIcon field={h.key as SortField} active={sortField} direction={sortDir} />}
            </div>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          {error ? (
            <div className="flex flex-col items-center justify-center gap-2 h-full text-muted-foreground">
              <Inbox className="h-12 w-12 stroke-[1.5] text-destructive/60" />
              <span className="text-sm font-medium text-destructive">Failed to load messages</span>
              <span className="text-xs text-muted-foreground/60">{error}</span>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 h-full text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Loading messages...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 h-full text-muted-foreground">
              <Inbox className="h-12 w-12 stroke-[1.5]" />
              <span className="text-sm font-medium">No messages</span>
              <span className="text-xs text-muted-foreground/60">Consume a queue to see messages</span>
            </div>
          ) : (
            filtered.map((msg, idx) => {
              const isSelected = selectedMessage?.id === msg.id
              return (
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
                  className={`grid gap-0 cursor-pointer transition-colors border-b border-border last:border-b-0 ${isSelected
                    ? "bg-accent text-accent-foreground"
                    : idx % 2 === 1
                      ? "bg-muted/10 hover:bg-muted/40"
                      : "hover:bg-muted/30"
                    }`}
                  style={{ gridTemplateColumns: headers.map((h) => h.width).join(" ") }}
                >
                  <div className="px-4 py-2.5 text-xs tabular-nums">{msg.timestamp.toLocaleString()}</div>
                  <div className="px-4 py-2.5 text-xs font-mono truncate text-foreground/80">{msg.id}</div>
                  <div className="px-2 py-2.5 flex items-center justify-center" />
                  <div className="px-4 py-2.5 text-xs truncate text-muted-foreground">{trimPayload(msg.payload)}</div>
                  <div className="px-4 py-2.5 text-xs tabular-nums text-right text-muted-foreground">{formatSize(getMessageSize(msg))}</div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export { MessageTable }
