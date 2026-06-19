import type { LucideIcon } from "lucide-react"

function EmptyState({ icon: Icon, message, description }: { icon: LucideIcon; message: string; description?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-sidebar-foreground/40">
      <Icon className="h-8 w-8" />
      <span className="text-xs">{message}</span>
      {description && <span className="text-xs text-muted-foreground/60">{description}</span>}
    </div>
  )
}

export { EmptyState }
