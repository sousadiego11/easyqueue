import { Button } from "@/components/ui/button"
import { useAppStore } from "@/stores/useAppStore"
import { Moon, Sun, Settings } from "lucide-react"

function Header() {
  const theme = useAppStore((s) => s.theme)
  const currentConnection = useAppStore((s) => s.currentConnection)
  const activeQueue = useAppStore((s) => s.activeQueue)

  return (
    <div className="flex items-center gap-2 px-4 h-14 border-b bg-sidebar flex-shrink-0">
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          currentConnection?.connected ? "bg-[#22c55e]" : "bg-[#f87171]"
        }`}
      />
      <span className="text-sm font-medium">{activeQueue || "No queue selected"}</span>
      <span className="text-sm text-muted-foreground">
        {currentConnection?.connected ? "Connected" : "Disconnected"}
      </span>
      <div className="flex-1" />
      <Button variant="ghost" size="icon" aria-label="Settings">
        <Settings className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onClick={() => useAppStore.getState().toggleTheme()}
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  )
}
export { Header }
