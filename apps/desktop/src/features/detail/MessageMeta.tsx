import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import type { QueueMessage } from "@easyqueue/core"

interface MessageMetaProps {
  msg: QueueMessage
}

function MessageMeta({ msg }: MessageMetaProps) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
        <span className="text-xs font-medium text-muted-foreground self-center">Message ID</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-foreground">{msg.id}</span>
          <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground" aria-label="Copy Message ID"><Copy className="h-3 w-3" /></Button>
        </div>

        <span className="text-xs font-medium text-muted-foreground self-center">Queue</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-foreground">{msg.queue}</span>
        </div>

        <span className="text-xs font-medium text-muted-foreground self-center">Timestamp</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-foreground">{msg.timestamp.toLocaleString()}</span>
        </div>

        {msg.headers && (
          <>
            <span className="text-xs font-medium text-muted-foreground self-center">Headers</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-foreground">
                {JSON.stringify(msg.headers).substring(0, 36) + "..."}
              </span>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground" aria-label="Copy Headers"><Copy className="h-3 w-3" /></Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export { MessageMeta }
