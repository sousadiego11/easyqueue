import type { Provider, QueueClient, QueueInfo, QueueMessage, PublishRequest } from "@easyqueue/core"

export class MockProvider implements QueueClient {
  id: string
  name: string
  provider: Provider
  _connected = false
  config: Record<string, unknown>
  queues: string[] = []
  messages = new Map<string, QueueMessage[]>()
  messageCounter = 0

  get connected() { return this._connected }

  constructor(config: Record<string, unknown> = {}, name = "Mock", id?: string) {
    this.id = id ?? crypto.randomUUID()
    this.name = name
    this.provider = (config.provider as Provider) ?? "sqs"
    this.config = config
  }

  async connect(): Promise<void> {
    this._connected = true
  }

  async disconnect(): Promise<void> {
    this._connected = false
    this.messages.clear()
  }

  async listQueues(): Promise<QueueInfo[]> {
    return [...this.queues].map((name) => ({ name }))
  }

  async listMessages(queue: string, limit = 100): Promise<QueueMessage[]> {
    return (this.messages.get(queue) ?? []).slice(0, limit)
  }

  async publish(request: PublishRequest): Promise<void> {
    const msg: QueueMessage = {
      id: `msg-${++this.messageCounter}`,
      queue: request.queue,
      payload: request.payload,
      timestamp: new Date(),
      headers: request.headers,
    }
    const existing = this.messages.get(request.queue) ?? []
    existing.push(msg)
    this.messages.set(request.queue, existing)
  }

  async deleteMessage(queue: string, messageId: string): Promise<void> {
    const existing = this.messages.get(queue) ?? []
    this.messages.set(queue, existing.filter((m) => m.id !== messageId))
  }

  async releaseMessage(queue: string, messageId: string): Promise<void> {
    const existing = this.messages.get(queue) ?? []
    this.messages.set(queue, existing.filter((m) => m.id !== messageId))
  }

  async releaseQueue(queue: string): Promise<void> {
    this.messages.set(queue, [])
  }

  async purgeQueue(queue: string): Promise<void> {
    this.messages.set(queue, [])
  }
}
