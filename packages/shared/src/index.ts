import type { Provider } from "@easyqueue/core"

export const IPC_CHANNELS = {
  CONNECT: "queue:connect",
  DISCONNECT: "queue:disconnect",
  LIST_QUEUES: "queue:list-queues",
  LIST_MESSAGES: "queue:list-messages",
  PUBLISH: "queue:publish",
  DELETE_MESSAGE: "queue:delete-message",
  CONNECTION_STATE_CHANGED: "queue:connection-state-changed",
  LIST_CONNECTIONS: "queue:list-connections",
  UPDATE_CONNECTION: "queue:update-connection",
  WINDOW_MINIMIZE: "window:minimize",
  WINDOW_MAXIMIZE: "window:maximize",
  WINDOW_CLOSE: "window:close",
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

export interface ConnectRequest {
  id: string
  name: string
  provider: Provider
  config: Record<string, unknown>
}

export interface ConnectionInfo {
  id: string
  name: string
  provider: Provider
  connected: boolean
  config: Record<string, unknown>
}

export interface PublishRequest {
  queue: string
  payload: unknown
  headers?: Record<string, string>
}
