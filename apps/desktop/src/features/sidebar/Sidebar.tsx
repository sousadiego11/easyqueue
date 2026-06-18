import { Button } from "@/components/ui/button"
import { ConnectionList } from "@/features/sidebar/ConnectionList"
import { QueueList } from "@/features/sidebar/QueueList"
import { useAppStore } from "@/stores/useAppStore"
import logoSvg from "@/icons/LOGO.svg"

function Sidebar() {
  return (
    <aside className="w-full h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-sidebar-border flex-shrink-0">
        <img src={logoSvg} alt="EasyQueue" className="w-8 h-8" />
        <span className="text-lg font-bold">
          <span className="text-sidebar-foreground">Easy</span>
          <span className="text-sidebar-primary">Queue</span>
        </span>
      </div>
      <div className="px-4 pb-4 pt-2.5 border-b border-sidebar-border">
        <ConnectionList />
      </div>
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <QueueList />
      </div>
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => useAppStore.getState().openNewConnectionModal()}
        >
          + New Connection
        </Button>
      </div>
    </aside>
  )
}
export { Sidebar }
