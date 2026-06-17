import { contextBridge, ipcRenderer } from "electron"
import { IPC_CHANNELS } from "@easyqueue/shared"
import type { QueueMessage } from "@easyqueue/core"
import type { Provider } from "@easyqueue/core"

export interface QueueApi {
  connect(name: string, provider: Provider, config: Record<string, unknown>): Promise<{ id: string; name: string; provider: string; connected: boolean; config: Record<string, unknown> }>
  disconnect(connectionId: string): Promise<void>
  listConnections(): Promise<Array<{ id: string; name: string; provider: string; connected: boolean; config: Record<string, unknown> }>>
  listQueues(connectionId: string): Promise<string[]>
  listMessages(connectionId: string, queue: string, limit?: number): Promise<QueueMessage[]>
  publish(connectionId: string, queue: string, payload: unknown, headers?: Record<string, string>): Promise<void>
  deleteMessage(connectionId: string, queue: string, messageId: string): Promise<void>
  updateConnection(connectionId: string, name: string, provider: Provider, config: Record<string, unknown>): Promise<{ id: string; name: string; provider: string; connected: boolean; config: Record<string, unknown> }>
  minimize(): void
  maximize(): void
  close(): void
}

const api: QueueApi = {
  connect: (name, provider, config) =>
    ipcRenderer.invoke(IPC_CHANNELS.CONNECT, name, provider, config),

  disconnect: (connectionId) =>
    ipcRenderer.invoke(IPC_CHANNELS.DISCONNECT, connectionId),

  listConnections: () =>
    ipcRenderer.invoke(IPC_CHANNELS.LIST_CONNECTIONS),

  listQueues: (connectionId) =>
    ipcRenderer.invoke(IPC_CHANNELS.LIST_QUEUES, connectionId),

  listMessages: (connectionId, queue, limit) =>
    ipcRenderer.invoke(IPC_CHANNELS.LIST_MESSAGES, connectionId, queue, limit),

  publish: (connectionId, queue, payload, headers) =>
    ipcRenderer.invoke(IPC_CHANNELS.PUBLISH, connectionId, queue, payload, headers),

  deleteMessage: (connectionId, queue, messageId) =>
    ipcRenderer.invoke(IPC_CHANNELS.DELETE_MESSAGE, connectionId, queue, messageId),

  updateConnection: (connectionId, name, provider, config) =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_CONNECTION, connectionId, name, provider, config),

  minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
}

contextBridge.exposeInMainWorld("queueApi", api)
