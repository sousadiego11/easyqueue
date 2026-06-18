import type { Provider } from "./Connection"
import type { PublishRequest } from "./PublishRequest"
import type { QueueInfo } from "./QueueInfo"
import type { QueueMessage } from "./QueueMessage"

export interface QueueClient {
  id: string
  name: string
  provider: Provider
  connected: boolean
  config: Record<string, unknown>
  connect(): Promise<void>
  disconnect(): Promise<void>
  listQueues(): Promise<QueueInfo[]>
  listMessages(queue: string, limit?: number): Promise<QueueMessage[]>
  publish(request: PublishRequest): Promise<void>
  deleteMessage(queue: string, messageId: string): Promise<void>
  purgeQueue(queue: string): Promise<void>
}
