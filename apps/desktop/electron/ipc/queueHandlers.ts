import { ipcMain } from "electron"
import { IPC_CHANNELS } from "@easyqueue/shared"
import type { QueueService } from "../services/QueueService"

export function registerQueueHandlers(queueService: QueueService): void {
  ipcMain.handle(IPC_CHANNELS.LIST_QUEUES, async (_event, connectionId: string) => {
    return queueService.listQueues(connectionId)
  })

  ipcMain.handle(IPC_CHANNELS.LIST_MESSAGES, async (_event, connectionId: string, queue: string, limit?: number) => {
    return queueService.listMessages(connectionId, queue, limit)
  })
}
