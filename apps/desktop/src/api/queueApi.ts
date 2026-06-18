import type { QueueMessage, Provider } from "@easyqueue/core"

export interface ConnectionInfo {
  id: string
  name: string
  provider: Provider
  connected: boolean
  config: Record<string, unknown>
}

export interface QueueApi {
  connect(name: string, provider: Provider, config: Record<string, unknown>): Promise<ConnectionInfo>
  disconnect(connectionId: string): Promise<void>
  listConnections(): Promise<ConnectionInfo[]>
  listQueues(connectionId: string): Promise<string[]>
  listMessages(connectionId: string, queue: string, limit?: number): Promise<QueueMessage[]>
  publish(connectionId: string, queue: string, payload: unknown, headers?: Record<string, string>): Promise<void>
  deleteMessage(connectionId: string, queue: string, messageId: string): Promise<void>
  clientConnect(connectionId: string): Promise<ConnectionInfo>
  clientDisconnect(connectionId: string): Promise<ConnectionInfo>
  updateConnection(connectionId: string, name: string, provider: Provider, config: Record<string, unknown>): Promise<ConnectionInfo>
  minimize(): void
  maximize(): void
  close(): void
}

function getApi(): QueueApi {
  if (typeof window !== "undefined" && (window as any).queueApi) {
    return (window as any).queueApi as QueueApi
  }
  throw new Error("queueApi not available. Are you running inside Electron?")
}

export const queueApi = getApi()
