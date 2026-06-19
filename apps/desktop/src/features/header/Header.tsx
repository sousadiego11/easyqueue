import { Button } from "@/components/ui/button"
import { StatusDot } from "@/components/ui/StatusDot"
import { useAppStore } from "@/stores/useAppStore"
import { Moon, Sun } from "lucide-react"

function Header() {
  const theme = useAppStore((s) => s.theme)
  const currentConnection = useAppStore((s) => s.currentConnection)
  const activeQueue = useAppStore((s) => s.activeQueue)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  return (
    <div className="flex items-center gap-2 px-4 h-14 border-b bg-sidebar flex-shrink-0">
      <StatusDot active={!!currentConnection?.connected} />
      <span className="text-sm font-medium">{activeQueue || "No queue selected"}</span>
      <span className="text-sm text-muted-foreground">
        {currentConnection?.connected ? "Connected" : "Disconnected"}
      </span>
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="icon"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onClick={toggleTheme}
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  )
}
export { Header }
