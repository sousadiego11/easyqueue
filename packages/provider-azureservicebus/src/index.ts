import { createHmac } from "node:crypto"
import { ServiceBusClient } from "@azure/service-bus"
import type { ServiceBusReceivedMessage, ServiceBusReceiver, ServiceBusSender } from "@azure/service-bus"
import type { PublishRequest, QueueClient, QueueInfo, QueueMessage } from "@easyqueue/core"
import { QueueError, QueueErrorCode } from "@easyqueue/core"
import type { Provider, AzureConfig } from "@easyqueue/core"

export class AzureServiceBusClient implements QueueClient {
  public id: string
  public name: string
  public provider: Provider = "azureservicebus"
  public _connected = false

  private client: ServiceBusClient | null = null
  private fetchedMessages = new Map<string, { message: ServiceBusReceivedMessage; queue: string }>()
  private receivers = new Map<string, ServiceBusReceiver>()

  public config: Record<string, unknown>

  get connected() { return this._connected }

  constructor(config: AzureConfig, name = "Azure Service Bus Client") {
    this.config = config
    this.validateConfig(config)
    this.id = crypto.randomUUID()
    this.name = name
  }

  private validateConfig(config: AzureConfig) {
    if (!config.connectionString)
      throw new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "Azure 'connectionString' is required")
  }

  async connect(): Promise<void> {
    const cfg = this.config as AzureConfig
    try {
      this.client = new ServiceBusClient(cfg.connectionString)
    } catch (err) {
      throw new QueueError(QueueErrorCode.CONNECTION_FAILED, "Failed to connect to Azure Service Bus", err)
    }
    this._connected = true
  }

  async disconnect(): Promise<void> {
    await this.returnFetchedMessages()
    for (const receiver of this.receivers.values()) {
      try { await receiver.close() } catch { }
    }
    this.receivers.clear()
    try { await this.client?.close() } catch { }
    this.client = null
    this._connected = false
  }

  async listQueues(): Promise<QueueInfo[]> {
    if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const queues = await this.fetchQueuesViaRestApi()
    return queues.map((q) => ({ name: q }))
  }

  private async fetchQueuesViaRestApi(): Promise<string[]> {
    const cs = (this.config as AzureConfig).connectionString
    const isEmulator = cs.toLowerCase().includes("localhost") || cs.toLowerCase().includes("127.0.0.1") || cs.toLowerCase().includes("emulator")
    const host = cs.match(/Endpoint\s*=\s*sb:\/\/([^;]+)/i)?.[1] ?? ""
    const keyName = cs.match(/SharedAccessKeyName\s*=\s*([^;]+)/i)?.[1] ?? ""
    const key = cs.match(/SharedAccessKey\s*=\s*([^;]+)/i)?.[1] ?? ""

    const hostWithPort = isEmulator && !host.includes(":") ? `${host}:5300` : host
    const protocol = isEmulator ? "http" : "https"
    const baseUrl = `${protocol}://${hostWithPort}`
    const url = `${baseUrl}/$Resources/Queues?api-version=2021-05`

    const token = this.generateSasToken(baseUrl, keyName, key)

    const res = await fetch(url, {
      headers: { Authorization: token, Accept: "application/json, application/atom+xml" },
    })
    if (!res.ok) {
      throw new QueueError(QueueErrorCode.UNKNOWN, `Management API returned ${res.status}`)
    }

    const text = await res.text()
    try {
      const data = JSON.parse(text) as { value: Array<{ name: string }> }
      return data.value.map((q) => q.name)
    } catch {
      return this.parseAtomXmlFeed(text)
    }
  }

  private parseAtomXmlFeed(xml: string): string[] {
    const names: string[] = []
    const entries = xml.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) ?? []
    for (const entry of entries) {
      const match = entry.match(/<title[^>]*>([^<]*)<\/title>/i)
      if (match) names.push(match[1])
    }
    return names
  }

  private generateSasToken(resourceUri: string, keyName: string, key: string): string {
    const sr = encodeURIComponent(resourceUri)
    const se = Math.floor(Date.now() / 1000) + 3600
    const sig = createHmac("sha256", Buffer.from(key, "utf8"))
      .update(sr + "\n" + se)
      .digest("base64")
    const sigEncoded = encodeURIComponent(sig)
    return `SharedAccessSignature sr=${sr}&sig=${sigEncoded}&se=${se}&skn=${keyName}`
  }

  async listMessages(queue: string, limit = 100): Promise<QueueMessage[]> {
    if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    await this.returnFetchedMessages(queue)

    const receiver = this.client.createReceiver(queue, { receiveMode: "peekLock" })
    this.receivers.set(queue, receiver)

    const received = await receiver.receiveMessages(limit, { maxWaitTimeInMs: 2000 })
    const messages: QueueMessage[] = []

    for (const msg of received) {
      const id = msg.messageId?.toString() ?? crypto.randomUUID()
      const queueMessage = this.toQueueMessage(queue, msg, id)
      this.fetchedMessages.set(id, { message: msg, queue })
      messages.push(queueMessage)
    }

    return messages
  }

  async publish(request: PublishRequest): Promise<void> {
    if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const sender: ServiceBusSender = this.client.createSender(request.queue)
    try {
      await sender.sendMessages({
        body: request.payload,
        applicationProperties: request.headers as Record<string, string> | undefined,
      })
    } finally {
      await sender.close()
    }
  }

  async deleteMessage(queue: string, messageId: string): Promise<void> {
    if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const entry = this.fetchedMessages.get(messageId)
    if (!entry) return

    const receiver = this.getOrCreateReceiver(entry.queue)
    await receiver.completeMessage(entry.message)
    this.fetchedMessages.delete(messageId)
  }

  async releaseMessage(queue: string, messageId: string): Promise<void> {
    if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const entry = this.fetchedMessages.get(messageId)
    if (!entry) return

    const receiver = this.getOrCreateReceiver(entry.queue)
    await receiver.abandonMessage(entry.message)
    this.fetchedMessages.delete(messageId)
  }

  async releaseQueue(queue: string): Promise<void> {
    if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const receiver = this.getOrCreateReceiver(queue)
    for (const [messageId, entry] of this.fetchedMessages) {
      if (entry.queue !== queue) continue
      try {
        await receiver.abandonMessage(entry.message)
        this.fetchedMessages.delete(messageId)
      } catch (err) {
        console.error("[AzureServiceBusClient] Failed to release message:", err)
      }
    }
  }

  async purgeQueue(queue: string): Promise<void> {
    if (!this.client) throw new QueueError(QueueErrorCode.PROVIDER_NOT_CONNECTED, "Not connected")

    const receiver = this.getOrCreateReceiver(queue)
    for (const [messageId, entry] of this.fetchedMessages) {
      if (entry.queue !== queue) continue
      try {
        await receiver.completeMessage(entry.message)
        this.fetchedMessages.delete(messageId)
      } catch (err) {
        console.error("[AzureServiceBusClient] Failed to purge message:", err)
      }
    }
  }

  private getOrCreateReceiver(queue: string): ServiceBusReceiver {
    let receiver = this.receivers.get(queue)
    if (!receiver) {
      receiver = this.client!.createReceiver(queue, { receiveMode: "peekLock" })
      this.receivers.set(queue, receiver)
    }
    return receiver
  }

  private async returnFetchedMessages(queue?: string): Promise<void> {
    if (!this.client) {
      this.fetchedMessages.clear()
      return
    }

    for (const [messageId, entry] of this.fetchedMessages) {
      if (queue && entry.queue !== queue) continue
      try {
        const receiver = this.receivers.get(entry.queue)
        if (receiver) await receiver.abandonMessage(entry.message)
        this.fetchedMessages.delete(messageId)
      } catch (err) {
        console.error("[AzureServiceBusClient] Failed to requeue message:", err)
      }
    }
  }

  private toQueueMessage(queue: string, msg: ServiceBusReceivedMessage, id: string): QueueMessage {
    return {
      id,
      queue,
      payload: msg.body,
      timestamp: msg.enqueuedTimeUtc ?? new Date(),
      headers: msg.applicationProperties as Record<string, string> | undefined,
      raw: {
        sequenceNumber: msg.sequenceNumber,
        lockToken: msg.lockToken,
        enqueuedTimeUtc: msg.enqueuedTimeUtc,
        deliveryCount: msg.deliveryCount,
      },
    }
  }
}
