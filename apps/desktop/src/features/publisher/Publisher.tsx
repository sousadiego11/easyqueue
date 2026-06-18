import { Button } from "@/components/ui/button"
import { JsonEditor } from "@/components/ui/JsonEditor"
import { useAppStore } from "@/stores/useAppStore"
import { queueApi } from "@/api/queueApi"
import { Play } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { Content } from "vanilla-jsoneditor"

const DEFAULT_JSON = JSON.stringify({ key: "value" }, null, 2)

function Publisher() {
  const currentConnection = useAppStore((s) => s.currentConnection)
  const queue = useAppStore((s) => s.activeQueue)
  const theme = useAppStore((s) => s.theme)
  const [raw, setRaw] = useState(DEFAULT_JSON)
  const [error, setError] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)

  function handleChange(content: Content) {
    if ("text" in content) {
      setRaw(content.text)
      setError(null)
    }
  }

  async function handleSend() {
    if (!currentConnection) return
    setIsPublishing(true)
    try {
      const payload = JSON.parse(raw)
      await queueApi.publish(currentConnection.id, queue, payload)
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

      <div className="flex-1 flex flex-col min-h-0 relative p-4">
        <JsonEditor
          className="flex-1"
          content={{ text: raw }}
          onChange={handleChange}
          dark={theme === "dark"}
        />
        {error && <span className="absolute bottom-1 left-2 text-xs text-destructive">{error}</span>}
      </div>
    </div>
  )
}

export { Publisher }
