import { ipcMain } from "electron"
import { IPC_CHANNELS } from "@easyqueue/shared"
import type { ConnectionService } from "../services/ConnectionService"
import type { Provider } from "@easyqueue/core"

export function registerConnectionHandlers(connectionService: ConnectionService): void {
  ipcMain.handle(IPC_CHANNELS.CONNECT, async (_event, name: string, provider: Provider, config: Record<string, unknown>) => {
    return connectionService.connect(name, provider, config)
  })

  ipcMain.handle(IPC_CHANNELS.DISCONNECT, async (_event, connectionId: string) => {
    await connectionService.disconnect(connectionId)
  })

  ipcMain.handle(IPC_CHANNELS.LIST_CONNECTIONS, async () => {
    return connectionService.listConnections()
  })

  ipcMain.handle(IPC_CHANNELS.CLIENT_CONNECT, async (_event, connectionId: string) => {
    return connectionService.clientConnect(connectionId)
  })

  ipcMain.handle(IPC_CHANNELS.CLIENT_DISCONNECT, async (_event, connectionId: string) => {
    return connectionService.clientDisconnect(connectionId)
  })

  ipcMain.handle(IPC_CHANNELS.UPDATE_CONNECTION, async (_event, connectionId: string, name: string, provider: Provider, config: Record<string, unknown>) => {
    return connectionService.updateConnection(connectionId, name, provider, config)
  })

  ipcMain.handle(IPC_CHANNELS.DELETE_CONNECTION, async (_event, connectionId: string) => {
    await connectionService.deleteConnection(connectionId)
  })
}
