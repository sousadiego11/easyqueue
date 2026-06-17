import type { PublishRequest, QueueClient, QueueMessage } from "@easyqueue/core"
import { QueueError, QueueErrorCode } from "@easyqueue/core"
import type { Provider, SQSConfig } from "@easyqueue/core"

export class AWSSQSClient implements QueueClient {
  public id: string
  public name: string
  public provider: Provider = "sqs"
  public _connected = false
  private queues = new Map<string, QueueMessage[]>()

  public config: Record<string, unknown>

  constructor(config: SQSConfig, name = "AWS SQS") {
    this.config = config
    this.validateConfig(config)
    this.id = crypto.randomUUID()
    this.name = name

    this.queues.set("orders", [
      {
        id: crypto.randomUUID(),
        queue: "orders",
        payload: { orderId: 1001, customerId: 42, total: 199.90, currency: "BRL" },
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        headers: { "content-type": "application/json", "x-service": "orders-api" },
        raw: {
          MessageId: crypto.randomUUID(),
          ReceiptHandle: "AQEBx123FakeReceiptHandle",
          Body: JSON.stringify({ orderId: 1001, customerId: 42, total: 199.90, currency: "BRL" }),
          Attributes: { ApproximateReceiveCount: "1", SentTimestamp: Date.now().toString() },
          MessageAttributes: {},
        },
      },
    ])

    this.queues.set("notifications", [
      {
        id: crypto.randomUUID(),
        queue: "notifications",
        payload: { type: "email", recipient: "user@email.com", template: "welcome" },
        timestamp: new Date(Date.now() - 1000 * 60 * 2),
        headers: { "content-type": "application/json" },
        raw: {
          MessageId: crypto.randomUUID(),
          ReceiptHandle: "AQEBanotherFakeReceipt",
          Body: JSON.stringify({ type: "email", recipient: "user@email.com", template: "welcome" }),
          Attributes: { ApproximateReceiveCount: "2" },
          MessageAttributes: {},
        },
      },
    ])
  }

  private validateConfig(config: SQSConfig) {
    if (!config.region) throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "SQS 'region' is required")
    if (!config.queueUrl) throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "SQS 'queueUrl' is required")
    if (!config.accessKeyId) throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "SQS 'accessKeyId' is required")
    if (!config.secretAccessKey) throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "SQS 'secretAccessKey' is required")
    try { new URL(config.queueUrl) } catch {
      throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "SQS 'queueUrl' must be valid URL")
    }
  }

  get connected() { return this._connected }

  async connect(): Promise<void> {
    console.log(`[SQS:${this.id}] Connected`)
    this._connected = true
  }

  async disconnect(): Promise<void> {
    console.log(`[SQS:${this.id}] Disconnected`)
    this._connected = false
  }

  async listQueues(): Promise<string[]> {
    return [...this.queues.keys()]
  }

  async listMessages(queue: string): Promise<QueueMessage[]> {
    return this.queues.get(queue) ?? []
  }

  async publish(request: PublishRequest): Promise<void> {
    const message: QueueMessage = {
      id: crypto.randomUUID(),
      queue: request.queue,
      payload: request.payload,
      timestamp: new Date(),
      headers: request.headers,
      raw: {
        MessageId: crypto.randomUUID(),
        ReceiptHandle: "AQEBfakeReceiptHandle",
        Body: JSON.stringify(request.payload),
        Attributes: { ApproximateReceiveCount: "1" },
        MessageAttributes: request.headers ?? {},
      },
    }

    if (!this.queues.has(request.queue)) {
      this.queues.set(request.queue, [])
    }
    this.queues.get(request.queue)!.push(message)
  }

  async deleteMessage(queue: string, messageId: string): Promise<void> {
    const messages = this.queues.get(queue)
    if (!messages) return
    const idx = messages.findIndex((m) => m.id === messageId)
    if (idx !== -1) messages.splice(idx, 1)
  }
}
