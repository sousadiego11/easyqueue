import { useEffect } from "react"
import { Sidebar } from "@/features/sidebar/Sidebar"
import { ContentArea } from "@/features/sidebar/ContentArea"
import { DetailPanel } from "@/features/detail/DetailPanel"
import { Publisher } from "@/features/publisher/Publisher"
import { SplitPane } from "@/components/ui/SplitPane"
import { NewConnectionModal } from "@/features/sidebar/NewConnectionModal"
import { Header } from "@/features/header/Header"
import { TitleBar } from "@/features/titlebar/TitleBar"
import { Toaster } from "@/components/ui/sonner"
import { useAppStore } from "@/stores/useAppStore"
import { useConnectionStore } from "@/stores/useConnectionStore"
import { useMessageStore } from "@/stores/useMessageStore"

function App() {
  const selectedMessage = useMessageStore((s) => s.selectedMessage)
  const isNewConnectionModalOpen = useAppStore((s) => s.isNewConnectionModalOpen)
  const editingConnectionId = useAppStore((s) => s.editingConnectionId)
  const currentConnection = useAppStore((s) => s.currentConnection)
  const loadConnections = useConnectionStore((s) => s.loadConnections)
  const setCurrentConnection = useAppStore((s) => s.setCurrentConnection)
  const setActiveQueue = useAppStore((s) => s.setActiveQueue)

  useEffect(() => {
    loadConnections().then((conns) => {
      if (conns.length > 0) {
        setCurrentConnection(conns[0])
      }
    })
  }, [loadConnections, setCurrentConnection])

  useEffect(() => {
    if (!currentConnection) {
      setActiveQueue("")
    }
  }, [currentConnection, setActiveQueue])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <SplitPane defaultSize={240} storageKey="sidebar-width" leftId="sidebar" rightId="main">
          <Sidebar />
          <div className="flex flex-col h-full overflow-hidden">
            <Header />
            {selectedMessage ? (
              <SplitPane
                defaultSize={60}
                storageKey="content-detail-width"
                leftId="content"
                rightId="detail"
              >
                <SplitPane direction="vertical" defaultSize={200} storageKey="content-publisher-height" leftId="content-area" rightId="publisher">
                  <ContentArea />
                  <Publisher />
                </SplitPane>
                <DetailPanel />
              </SplitPane>
            ) : (
              <SplitPane
                direction="vertical"
                defaultSize={200}
                storageKey="content-publisher-height"
                leftId="content-area"
                rightId="publisher"
              >
                <ContentArea />
                <Publisher />
              </SplitPane>
            )}
          </div>
        </SplitPane>
      </div>
      {(isNewConnectionModalOpen || editingConnectionId) && <NewConnectionModal />}
      <Toaster />
    </div>
  )
}
export default App
