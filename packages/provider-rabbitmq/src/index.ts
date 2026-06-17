import amqplib, { type Channel, type ChannelModel, type GetMessage } from "amqplib"
import type { PublishRequest, QueueClient, QueueMessage } from "@easyqueue/core"
import { QueueError, QueueErrorCode } from "@easyqueue/core"
import type { Provider, RabbitMQConfig } from "@easyqueue/core"

export class RabbitMqClient implements QueueClient {
  public id: string
  public name: string
  public provider: Provider = "rabbitmq"
  public _connected = false

  private channelModel: ChannelModel | null = null
  private channel: Channel | null = null
  private fetchedMessages = new Map<string, GetMessage>()

  public config: Record<string, unknown>

  get connected() { return this._connected }

  constructor(config: RabbitMQConfig, name = "RabbitMQ Client") {
    this.config = config
    this.validateConfig(config)
    this.id = crypto.randomUUID()
    this.name = name
  }

  private validateConfig(config: RabbitMQConfig) {
    if (!config.url) throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "RabbitMQ 'url' is required")
    if (!config.managementUrl) throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "RabbitMQ 'managementUrl' is required")
    if (!config.managementUser) throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "RabbitMQ 'managementUser' is required")
    if (!config.managementPassword) throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "RabbitMQ 'managementPassword' is required")
    try { new URL(config.url) } catch {
      throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "RabbitMQ 'url' must be valid")
    }
    try { new URL(config.managementUrl) } catch {
      throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "RabbitMQ 'managementUrl' must be valid")
    }
  }

  private async setupChannel(): Promise<void> {
    if (!this.channelModel) return
    this.channel = await this.channelModel.createChannel()

    this.channel.on("error", async (err) => {
      console.error("[RabbitMqClient] Channel error:", err)
      this.channel = null
      if (!this._connected) return
      await new Promise(res => setTimeout(res, 500))
      try {
        await this.setupChannel()
      } catch (setupErr) {
        console.error("[RabbitMqClient] Failed to recover channel:", setupErr)
      }
    })
  }

  async connect(): Promise<void> {
    this.channelModel = await amqplib.connect((this.config as RabbitMQConfig).url)
    this._connected = true

    this.channelModel.connection.on("close", () => {
      this._connected = false
      this.channel = null
    })

    await this.setupChannel()
  }

  async disconnect(): Promise<void> {
    this.fetchedMessages.clear()
    try { await this.channel?.close() } catch { }
    try { await this.channelModel?.close() } catch { }
    this.channel = null
    this.channelModel = null
    this._connected = false
  }

  private getManagementAuth(): { base: string; auth: string } {
    const cfg = this.config as RabbitMQConfig
    if (!cfg.managementUrl) {
      throw new QueueError(QueueErrorCode.UNSUPPORTED_PROVIDER, "Management URL is required to list queues")
    }

    const managementUrl = new URL(cfg.managementUrl)
    const amqpUrl = new URL(cfg.url)
    const user = cfg.managementUser || managementUrl.username || amqpUrl.username || "guest"
    const pass = cfg.managementPassword || managementUrl.password || amqpUrl.password || "guest"

    return {
      base: `${managementUrl.protocol}//${managementUrl.host}`,
      auth: Buffer.from(`${user}:${pass}`).toString("base64"),
    }
  }

  async listQueues(): Promise<string[]> {
    const { base, auth } = this.getManagementAuth()
    const res = await fetch(`${base}/api/queues`, {
      headers: { Authorization: `Basic ${auth}` },
    })

    if (!res.ok) {
      throw new QueueError(QueueErrorCode.CONNECTION_FAILED, `Failed to list queues: ${res.statusText}`)
    }

    const data = await res.json() as Array<{ name: string }>
    return data.map((q) => q.name)
  }

  async listMessages(queue: string, limit = 100): Promise<QueueMessage[]> {
    if (!this.channel) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    this.fetchedMessages.clear()

    const messages: QueueMessage[] = []
    for (let i = 0; i < limit; i++) {
      const msg = await this.channel.get(queue, { noAck: false })
      if (!msg) break

      const queueMessage = this.toQueueMessage(queue, msg)
      this.fetchedMessages.set(queueMessage.id, msg)
      messages.push(queueMessage)
    }
    return messages
  }

  async publish(request: PublishRequest): Promise<void> {
    if (!this.channel) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const buffer = Buffer.from(JSON.stringify(request.payload))
    const messageId = crypto.randomUUID()

    const published = this.channel.publish("", request.queue, buffer, {
      messageId,
      contentType: "application/json",
      headers: request.headers,
      deliveryMode: 2,
      timestamp: Math.floor(Date.now() / 1000),
    })

    if (!published) {
      throw new QueueError(QueueErrorCode.PUBLISH_FAILED, "Failed to publish message: channel in write-blocking mode")
    }
  }

  async deleteMessage(queue: string, messageId: string): Promise<void> {
    if (!this.channel) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const msg = this.fetchedMessages.get(messageId)
    if (!msg) return

    this.channel.ack(msg)
    this.fetchedMessages.delete(messageId)
  }

  private toQueueMessage(queue: string, msg: GetMessage): QueueMessage {
    const content = msg.content.toString()
    const payload = this.tryParse(content)

    return {
      id: String(msg.fields.deliveryTag),
      queue,
      payload,
      timestamp: msg.properties.timestamp ? new Date(msg.properties.timestamp * 1000) : new Date(),
      headers: msg.properties.headers as Record<string, string> | undefined,
      raw: {
        fields: msg.fields,
        properties: msg.properties,
        content,
      },
    }
  }

  private tryParse(content: string): unknown {
    try {
      return JSON.parse(content)
    } catch {
      return content
    }
  }
}