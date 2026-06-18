import { Button } from "@/components/ui/button"
import { JsonEditor } from "@/components/ui/JsonEditor"
import { Separator } from "@/components/ui/separator"
import { useAppStore } from "@/stores/useAppStore"
import { queueApi } from "@/api/queueApi"
import { Play } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

const DEFAULT_PAYLOAD = JSON.stringify({ key: "value" }, null, 2)
const DEFAULT_HEADERS = JSON.stringify({}, null, 2)

function Publisher() {
  const currentConnection = useAppStore((s) => s.currentConnection)
  const queue = useAppStore((s) => s.activeQueue)
  const theme = useAppStore((s) => s.theme)
  const [payloadRaw, setPayloadRaw] = useState(DEFAULT_PAYLOAD)
  const [headersRaw, setHeadersRaw] = useState(DEFAULT_HEADERS)
  const [error, setError] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)

  async function handleSend() {
    if (!currentConnection) return
    setIsPublishing(true)
    try {
      const payload = JSON.parse(payloadRaw)
      const headers = JSON.parse(headersRaw)
      if (typeof headers !== "object" || headers === null || Array.isArray(headers)) {
        throw new Error("Headers must be a JSON object")
      }
      await queueApi.publish(currentConnection.id, queue, payload, headers)
      setError(null)
      toast.success("Message published")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid JSON"
      setError(message)
      toast.error(message)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="border-t bg-card flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card flex-shrink-0">
        <span className="text-sm font-semibold">Publisher</span>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSend} loading={isPublishing} disabled={!currentConnection?.connected}><Play size={14} /> Publish</Button>
        </div>
      </div>

      <div className="flex-1 flex flex-row min-h-0 p-4 gap-4">
        <div className="flex-1 flex flex-col min-h-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Payload</span>
          <div className="flex-1 min-h-0 relative">
            <JsonEditor
              className="h-full"
              content={{ text: payloadRaw }}
              onChange={(content) => { if ("text" in content) { setPayloadRaw(content.text); setError(null) } }}
              dark={theme === "dark"}
            />
          </div>
        </div>

        <Separator orientation="vertical" className="h-full" />

        <div className="flex-1 flex flex-col min-h-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Headers</span>
          <div className="flex-1 min-h-0 relative">
            <JsonEditor
              className="h-full"
              content={{ text: headersRaw }}
              onChange={(content) => { if ("text" in content) { setHeadersRaw(content.text); setError(null) } }}
              dark={theme === "dark"}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 pb-2 flex-shrink-0">
          <span className="text-xs text-destructive">{error}</span>
        </div>
      )}
    </div>
  )
}

export { Publisher }
