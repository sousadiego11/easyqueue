import { Minus, Square, X } from "lucide-react"
import logoSvg from "@/icons/LOGO.svg"
import { queueApi } from "@/api/queueApi"

function TitleBar() {
  return (
    <div className="flex items-center h-9 bg-card border-b select-none flex-shrink-0 app-drag-region">
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <img src={logoSvg} alt="EasyQueue" className="w-4 h-4" />
        <span className="text-xs font-semibold tracking-tight">
          <span className="text-foreground">Easy</span>
          <span className="text-primary">Queue</span>
        </span>
      </div>

      <div className="flex-1" />
      <div className="flex app-no-drag">
        <button
          onClick={() => queueApi.minimize()}
          className="flex items-center justify-center w-11 h-9 text-muted-foreground hover:bg-accent transition-colors outline-none focus-visible:outline-none focus-visible:ring-0"
          aria-label="Minimize"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => queueApi.maximize()}
          className="flex items-center justify-center w-11 h-9 text-muted-foreground hover:bg-accent transition-colors outline-none focus-visible:outline-none focus-visible:ring-0"
          aria-label="Maximize"
        >
          <Square className="h-3 w-3" />
        </button>
        <button
          onClick={() => queueApi.close()}
          className="flex items-center justify-center w-11 h-9 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors outline-none focus-visible:outline-none focus-visible:ring-0"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export { TitleBar }