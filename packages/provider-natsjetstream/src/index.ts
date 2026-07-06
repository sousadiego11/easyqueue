import { connect, AckPolicy, DeliverPolicy, headers } from "nats"
import type { JsMsg, JetStreamClient, JetStreamManager } from "nats"
import type { NatsConfig } from "@easyqueue/core"
import type { PublishRequest, QueueClient, QueueInfo, QueueMessage } from "@easyqueue/core"
import { QueueError, QueueErrorCode } from "@easyqueue/core"
import type { Provider } from "@easyqueue/core"

export class NatsJetStreamClient implements QueueClient {
  public id: string
  public name: string
  public provider: Provider = "natsjetstream"
  public _connected = false
  public config: Record<string, unknown>

  private nc: Awaited<ReturnType<typeof connect>> | null = null
  private js: JetStreamClient | null = null
  private jsm: JetStreamManager | null = null
  private consumers = new Map<string, Awaited<ReturnType<JetStreamClient["consumers"]["get"]>>>()
  private fetchedMessages = new Map<string, JsMsg>()

  get connected() { return this._connected }

  constructor(config: NatsConfig, name = "NATS JetStream Client") {
    this.config = config
    this.validateConfig(config)
    this.id = crypto.randomUUID()
    this.name = name
  }

  private validateConfig(config: NatsConfig) {
    if (!config.servers)
      throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "NATS 'servers' is required")
    try { new URL(config.servers) } catch {
      throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "NATS 'servers' must be a valid URL (e.g., nats://localhost:4222)")
    }
  }

  async connect(): Promise<void> {
    const cfg = this.config as NatsConfig
    try {
      const opts: Record<string, unknown> = { servers: cfg.servers }
      if (cfg.user) opts.user = cfg.user
      if (cfg.password) opts.password = cfg.password

      this.nc = await connect(opts)
      this.jsm = await this.nc.jetstreamManager()
      this.js = this.nc.jetstream()

      const iter = await this.jsm.streams.list()
      await iter.next()
    } catch (err) {
      await this.disconnect()
      throw new QueueError(QueueErrorCode.CONNECTION_FAILED, "Failed to connect to NATS JetStream", err)
    }
    this._connected = true
  }

  async disconnect(): Promise<void> {
    this.fetchedMessages.clear()
    this.consumers.clear()
    if (this.nc) {
      try { await this.nc.drain() } catch { }
      this.nc = null
      this.js = null
      this.jsm = null
    }
    this._connected = false
  }

  async listQueues(): Promise<QueueInfo[]> {
    if (!this.jsm) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const streams: QueueInfo[] = []
    for await (const s of this.jsm.streams.list()) {
      streams.push({ name: s.config.name })
    }
    return streams
  }

  async listMessages(stream: string, limit = 100): Promise<QueueMessage[]> {
    if (!this.js || !this.jsm) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    this.fetchedMessages.clear()

    const consumerName = `easyqueue-${this.id}-${stream}`
    let consumer = this.consumers.get(consumerName)
    if (!consumer) {
      try {
        await this.jsm.consumers.add(stream, {
          durable_name: consumerName,
          ack_policy: AckPolicy.Explicit,
          deliver_policy: DeliverPolicy.All,
        })
      } catch (err: any) {
        if (err.code !== 10065) throw err
      }
      consumer = await this.js.consumers.get(stream, consumerName)
      this.consumers.set(consumerName, consumer)
    }

    const msgs = await consumer.fetch({ max_messages: limit, expires: 5000 })
    const messages: QueueMessage[] = []

    const timer = setTimeout(() => { try { msgs.close() } catch {} }, 5000)
    try {
      for await (const msg of msgs) {
        const id = msg.seq.toString()
        this.fetchedMessages.set(id, msg)
        messages.push(this.toQueueMessage(stream, msg, id))
      }
    } finally {
      clearTimeout(timer)
    }

    return messages
  }

  async publish(request: PublishRequest): Promise<void> {
    if (!this.js || !this.jsm) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const stream = request.queue
    const data = Buffer.from(JSON.stringify(request.payload))
    const opts: Record<string, unknown> = {}
    if (request.headers) {
      const h = headers()
      for (const [key, value] of Object.entries(request.headers)) {
        h.set(key, value)
      }
      opts.headers = h
    }

    await this.js.publish(stream, data, opts)
  }

  async deleteMessage(stream: string, messageId: string): Promise<void> {
    if (!this.nc) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const msg = this.fetchedMessages.get(messageId)
    if (!msg) return

    await msg.ack()
    this.fetchedMessages.delete(messageId)
  }

  async releaseMessage(stream: string, messageId: string): Promise<void> {
    if (!this.nc) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const msg = this.fetchedMessages.get(messageId)
    if (!msg) return

    await msg.nak()
    this.fetchedMessages.delete(messageId)
  }

  async releaseQueue(stream: string): Promise<void> {
    if (!this.nc) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    for (const [messageId, msg] of this.fetchedMessages) {
      try {
        await msg.nak()
        this.fetchedMessages.delete(messageId)
      } catch (err) {
        console.error("[NatsJetStreamClient] Failed to release message:", err)
      }
    }
  }

  async purgeQueue(stream: string): Promise<void> {
    if (!this.nc) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    for (const [messageId, msg] of this.fetchedMessages) {
      try {
        await msg.ack()
        this.fetchedMessages.delete(messageId)
      } catch (err) {
        console.error("[NatsJetStreamClient] Failed to purge message:", err)
      }
    }
  }

  private toQueueMessage(stream: string, msg: JsMsg, id: string): QueueMessage {
    let payload: unknown = null
    if (msg.data) {
      const rawData = Buffer.from(msg.data).toString()
      try { payload = JSON.parse(rawData) } catch { payload = rawData }
    }

    let headers: Record<string, string> | undefined
    if (msg.headers) {
      headers = {}
      for (const [k, v] of msg.headers) {
        headers[k] = Array.isArray(v) ? v[0] : v
      }
    }

    return {
      id,
      queue: stream,
      payload,
      timestamp: (msg as any).info?.timestamp ?? new Date(),
      headers,
      raw: { seq: msg.seq, subject: msg.subject },
    }
  }
}
