import { createClient, type RedisClientType } from "redis"
import type { PublishRequest, QueueClient, QueueInfo, QueueMessage } from "@easyqueue/core"
import { QueueError, QueueErrorCode } from "@easyqueue/core"
import type { Provider, RedisConfig } from "@easyqueue/core"

export class RedisStreamClient implements QueueClient {
    public id: string
    public name: string
    public provider: Provider = "redis"
    public _connected = false

    private client: RedisClientType | null = null
    private fetchedMessages = new Map<string, { stream: string; id: string }>()

    private readonly consumerGroup = "easyqueue"
    private readonly consumerName: string

    public config: Record<string, unknown>

    get connected() { return this._connected }

    constructor(config: RedisConfig, name = "Redis Stream Client") {
        this.config = config
        this.validateConfig(config)
        this.id = crypto.randomUUID()
        this.name = name
        this.consumerName = `consumer-${this.id}`
    }

    private validateConfig(config: RedisConfig) {
        if (!config.url) throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "Redis 'url' is required")
        try { new URL(config.url) } catch {
            throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "Redis 'url' must be valid")
        }
    }

    async connect(): Promise<void> {
        this.client = createClient({ url: (this.config as RedisConfig).url }) as RedisClientType

        this.client.on("error", (err) => {
            console.error("[RedisStreamClient] Client error:", err)
        })

        this.client.on("end", () => {
            this._connected = false
            this.fetchedMessages.clear()
        })

        try {
            await this.client.connect()
        } catch (err) {
            this.client.destroy()
            this.client = null
            throw new QueueError(QueueErrorCode.CONNECTION_FAILED, "Failed to connect to Redis", err)
        }

        this._connected = true
    }

    async disconnect(): Promise<void> {
        await this.returnFetchedMessages()
        try { this.client?.destroy() } catch { }
        this.client = null
        this._connected = false
    }

    async listQueues(): Promise<QueueInfo[]> {
        if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

        const keys = await this.client.keys("*")
        const queues: QueueInfo[] = []

        for (const key of keys) {
            const type = await this.client.type(key)
            if (type === "stream") queues.push({ name: key })
        }

        return queues
    }

    async listMessages(queue: string, limit = 100): Promise<QueueMessage[]> {
        if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    await this.returnFetchedMessages()
    await this.ensureConsumerGroup(queue)

        const response = await this.client.xReadGroup(
            this.consumerGroup,
            this.consumerName,
            [{ key: queue, id: ">" }],
            { COUNT: limit }
        )

        if (!response) return []

        const messages: QueueMessage[] = []

        for (const stream of response) {
            for (const entry of stream.messages) {
                const queueMessage = this.toQueueMessage(queue, entry)
                this.fetchedMessages.set(queueMessage.id, { stream: queue, id: entry.id })
                messages.push(queueMessage)
            }
        }

        return messages
    }

    async publish(request: PublishRequest): Promise<void> {
        if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

        const fields: Record<string, string> = {
            payload: JSON.stringify(request.payload),
            publishedAt: new Date().toISOString(),
        }

        if (request.headers) {
            fields["headers"] = JSON.stringify(request.headers)
        }

        await this.client.xAdd(request.queue, "*", fields)
    }

    async deleteMessage(queue: string, messageId: string): Promise<void> {
        if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

        const entry = this.fetchedMessages.get(messageId)
        if (!entry) return

        await this.client.xAck(entry.stream, this.consumerGroup, entry.id)
        await this.client.xDel(entry.stream, entry.id)
        this.fetchedMessages.delete(messageId)
    }

    async releaseMessage(queue: string, messageId: string): Promise<void> {
        if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

        const entry = this.fetchedMessages.get(messageId)
        if (!entry) return

        await this.requeue(entry.stream, entry.id)
        this.fetchedMessages.delete(messageId)
    }

    async releaseQueue(queue: string): Promise<void> {
        if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

        for (const [messageId, entry] of this.fetchedMessages) {
            if (entry.stream !== queue) continue
            try {
                await this.requeue(entry.stream, entry.id)
                this.fetchedMessages.delete(messageId)
            } catch (err) {
                console.error("[RedisStreamClient] Failed to release message:", err)
            }
        }
    }

    async purgeQueue(queue: string): Promise<void> {
        if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

        for (const [messageId, entry] of this.fetchedMessages) {
            if (entry.stream !== queue) continue
            try {
                await this.client.xAck(entry.stream, this.consumerGroup, entry.id)
                await this.client.xDel(entry.stream, entry.id)
                this.fetchedMessages.delete(messageId)
            } catch (err) {
                console.error("[RedisStreamClient] Failed to purge message:", err)
            }
        }
    }

    private async requeue(stream: string, id: string): Promise<void> {
        const original = await this.client!.xRange(stream, id, id)
        if (original.length > 0) {
            await this.client!.xAdd(stream, "*", original[0].message)
        }
        await this.client!.xAck(stream, this.consumerGroup, id)
        await this.client!.xDel(stream, id)
    }

  private async returnFetchedMessages(queue?: string): Promise<void> {
    if (!this.client || this.fetchedMessages.size === 0) {
      this.fetchedMessages.clear()
      return
    }

    for (const [messageId, entry] of this.fetchedMessages) {
      if (queue && entry.stream !== queue) continue
      try {
        await this.requeue(entry.stream, entry.id)
        this.fetchedMessages.delete(messageId)
      } catch (err) {
        console.error("[RedisStreamClient] Failed to requeue message on clear:", err)
      }
    }
  }

    private async ensureConsumerGroup(queue: string): Promise<void> {
        try {
            await this.client!.xGroupCreate(queue, this.consumerGroup, "0", { MKSTREAM: true })
        } catch (err: any) {
            if (!err?.message?.includes("BUSYGROUP")) throw err
        }
    }

    private toQueueMessage(queue: string, entry: { id: string; message: Record<string, string> }): QueueMessage {
        const { payload, headers, publishedAt } = entry.message

        let parsedPayload: unknown
        if (payload !== undefined) {
            parsedPayload = this.tryParse(payload)
        } else {
            parsedPayload = entry.message
        }

        return {
            id: entry.id,
            queue,
            payload: parsedPayload,
            timestamp: publishedAt ? new Date(publishedAt) : new Date(),
            headers: headers ? (this.tryParse(headers) as Record<string, string>) : undefined,
            raw: {
                streamId: entry.id,
                fields: entry.message,
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