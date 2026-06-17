import {
  SQSClient,
  ListQueuesCommand,
  GetQueueUrlCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  DeleteMessageCommand,
  type Message,
} from "@aws-sdk/client-sqs"
import type { PublishRequest, QueueClient, QueueMessage } from "@easyqueue/core"
import { QueueError, QueueErrorCode } from "@easyqueue/core"
import type { Provider, SQSConfig } from "@easyqueue/core"

export class AWSSQSClient implements QueueClient {
  public id: string
  public name: string
  public provider: Provider = "sqs"
  public _connected = false
  public config: Record<string, unknown>

  private client: SQSClient | null = null
  private queueUrls = new Map<string, string>()
  private fetchedMessages = new Map<string, string>() // messageId -> receiptHandle

  get connected() { return this._connected }

  constructor(config: SQSConfig, name = "AWS SQS") {
    this.config = config
    this.validateConfig(config)
    this.id = crypto.randomUUID()
    this.name = name
  }

  private validateConfig(config: SQSConfig) {
    if (!config.region) throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "SQS 'region' is required")
    if (!config.accessKeyId) throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "SQS 'accessKeyId' is required")
    if (!config.secretAccessKey) throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "SQS 'secretAccessKey' is required")
  }

  private getSdkConfig(): SQSConfig {
    return this.config as unknown as SQSConfig
  }

  async connect(): Promise<void> {
    const cfg = this.getSdkConfig()

    this.client = new SQSClient({
      region: cfg.region,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    })

    try {
      await this.client.send(new ListQueuesCommand({ MaxResults: 1 }))
    } catch (err) {
      this.client.destroy()
      this.client = null
      throw new QueueError(QueueErrorCode.CONNECTION_FAILED, `Failed to connect to SQS: ${(err as Error).message}`)
    }

    this._connected = true
  }

  async disconnect(): Promise<void> {
    this.fetchedMessages.clear()
    this.client?.destroy()
    this.client = null
    this.queueUrls.clear()
    this._connected = false
  }

  async listQueues(): Promise<string[]> {
    if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const response = await this.client.send(new ListQueuesCommand({}))
    const urls = response.QueueUrls ?? []
    this.queueUrls.clear()

    const names: string[] = []
    for (const url of urls) {
      const name = this.extractQueueName(url)
      this.queueUrls.set(name, url)
      names.push(name)
    }

    return names
  }

  async listMessages(queue: string, limit = 100): Promise<QueueMessage[]> {
    if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    this.fetchedMessages.clear()

    const queueUrl = await this.resolveQueueUrl(queue)
    const messages: QueueMessage[] = []

    while (messages.length < limit) {
      const batch = Math.min(limit - messages.length, 10)
      const response = await this.client.send(new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: batch,
        WaitTimeSeconds: 0,
        MessageAttributeNames: ["All"],
        AttributeNames: ["All"],
      }))

      const received = response.Messages ?? []
      for (const msg of received) {
        const queueMessage = this.toQueueMessage(queue, msg)
        this.fetchedMessages.set(queueMessage.id, msg.ReceiptHandle!)
        messages.push(queueMessage)
      }

      if (received.length === 0) break
    }

    return messages
  }

  async publish(request: PublishRequest): Promise<void> {
    if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const queueUrl = await this.resolveQueueUrl(request.queue)

    await this.client.send(new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: typeof request.payload === "string" ? request.payload : JSON.stringify(request.payload),
      MessageAttributes: request.headers
        ? Object.fromEntries(
          Object.entries(request.headers).map(([k, v]) => [
            k,
            { DataType: "String", StringValue: v },
          ])
        )
        : undefined,
    }))
  }

  async deleteMessage(queue: string, messageId: string): Promise<void> {
    if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const receiptHandle = this.fetchedMessages.get(messageId)
    if (!receiptHandle) return

    const queueUrl = await this.resolveQueueUrl(queue)

    await this.client.send(new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    }))

    this.fetchedMessages.delete(messageId)
  }

  private async resolveQueueUrl(queue: string): Promise<string> {
    if (this.queueUrls.has(queue)) return this.queueUrls.get(queue)!

    if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const response = await this.client.send(new GetQueueUrlCommand({ QueueName: queue }))

    if (!response.QueueUrl) {
      throw new QueueError(QueueErrorCode.UNKNOWN, `Queue "${queue}" not found`)
    }

    this.queueUrls.set(queue, response.QueueUrl)
    return response.QueueUrl
  }

  private toQueueMessage(queue: string, msg: Message): QueueMessage {
    const body = msg.Body ?? "{}"
    const payload = this.tryParse(body)

    return {
      id: msg.MessageId ?? crypto.randomUUID(),
      queue,
      payload,
      timestamp: msg.Attributes?.SentTimestamp
        ? new Date(Number(msg.Attributes.SentTimestamp))
        : new Date(),
      headers: msg.MessageAttributes
        ? Object.fromEntries(
          Object.entries(msg.MessageAttributes).map(([k, v]) => [
            k,
            (v as { StringValue?: string }).StringValue ?? String(v),
          ])
        )
        : undefined,
      raw: {
        messageId: msg.MessageId,
        receiptHandle: msg.ReceiptHandle,
        body,
        attributes: msg.Attributes,
        messageAttributes: msg.MessageAttributes,
        md5OfBody: msg.MD5OfBody,
      },
    }
  }

  private extractQueueName(url: string): string {
    const parts = url.split("/")
    return parts[parts.length - 1]
  }

  private tryParse(content: string): unknown {
    try {
      return JSON.parse(content)
    } catch {
      return content
    }
  }
}