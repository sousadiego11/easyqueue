import { ipcMain } from "electron"
import { IPC_CHANNELS } from "@easyqueue/shared"
import type { MessageService } from "../services/MessageService"

export function registerMessageHandlers(messageService: MessageService): void {
  ipcMain.handle(IPC_CHANNELS.PUBLISH, async (_event, connectionId: string, queue: string, payload: unknown, headers?: Record<string, string>) => {
    await messageService.publish(connectionId, queue, payload, headers)
  })

  ipcMain.handle(IPC_CHANNELS.DELETE_MESSAGE, async (_event, connectionId: string, queue: string, messageId: string) => {
    await messageService.deleteMessage(connectionId, queue, messageId)
  })
}
