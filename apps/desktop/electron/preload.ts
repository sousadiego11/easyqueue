import { contextBridge, ipcRenderer } from "electron"
import { IPC_CHANNELS } from "@easyqueue/shared"
import type { QueueInfo, QueueMessage } from "@easyqueue/core"
import type { Provider } from "@easyqueue/core"

export interface QueueApi {
  connect(name: string, provider: Provider, config: Record<string, unknown>): Promise<{ id: string; name: string; provider: string; connected: boolean; config: Record<string, unknown> }>
  disconnect(connectionId: string): Promise<void>
  listConnections(): Promise<Array<{ id: string; name: string; provider: string; connected: boolean; config: Record<string, unknown> }>>
  listQueues(connectionId: string): Promise<QueueInfo[]>
  listMessages(connectionId: string, queue: string, limit?: number): Promise<QueueMessage[]>
  publish(connectionId: string, queue: string, payload: unknown, headers?: Record<string, string>): Promise<void>
  deleteMessage(connectionId: string, queue: string, messageId: string): Promise<void>
  releaseMessage(connectionId: string, queue: string, messageId: string): Promise<void>
  releaseQueue(connectionId: string, queue: string): Promise<void>
  purgeQueue(connectionId: string, queue: string): Promise<void>
  clientConnect(connectionId: string): Promise<{ id: string; name: string; provider: string; connected: boolean; config: Record<string, unknown> }>
  clientDisconnect(connectionId: string): Promise<{ id: string; name: string; provider: string; connected: boolean; config: Record<string, unknown> }>
  updateConnection(connectionId: string, name: string, provider: Provider, config: Record<string, unknown>): Promise<{ id: string; name: string; provider: string; connected: boolean; config: Record<string, unknown> }>
  deleteConnection(connectionId: string): Promise<void>
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

  releaseMessage: (connectionId, queue, messageId) =>
    ipcRenderer.invoke(IPC_CHANNELS.RELEASE_MESSAGE, connectionId, queue, messageId),

  releaseQueue: (connectionId, queue) =>
    ipcRenderer.invoke(IPC_CHANNELS.RELEASE_QUEUE, connectionId, queue),

  purgeQueue: (connectionId, queue) =>
    ipcRenderer.invoke(IPC_CHANNELS.PURGE_QUEUE, connectionId, queue),

  clientConnect: (connectionId) =>
    ipcRenderer.invoke(IPC_CHANNELS.CLIENT_CONNECT, connectionId),

  clientDisconnect: (connectionId) =>
    ipcRenderer.invoke(IPC_CHANNELS.CLIENT_DISCONNECT, connectionId),

  updateConnection: (connectionId, name, provider, config) =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_CONNECTION, connectionId, name, provider, config),

  deleteConnection: (connectionId) =>
    ipcRenderer.invoke(IPC_CHANNELS.DELETE_CONNECTION, connectionId),

  minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
}

contextBridge.exposeInMainWorld("queueApi", api)
