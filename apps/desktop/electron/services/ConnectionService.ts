import { QueueClient, type Provider } from "@easyqueue/core"
import type { ConnectionInfo } from "@easyqueue/shared"
import { RabbitMqClient } from "@easyqueue/provider-rabbitmq"
import { AWSSQSClient } from "@easyqueue/provider-sqs"
import { app, safeStorage } from "electron"
import path from "path"
import fs from "fs"
import { RedisStreamClient } from "@easyqueue/provider-redisstreams"

interface StoredConnection {
  id: string
  name: string
  provider: Provider
  config: Record<string, unknown>
}

export class ConnectionService {
  private clients = new Map<string, QueueClient>()
  private filePath: string
  private legacyPath: string

  constructor(filePath?: string) {
    const base = filePath ?? path.join(app.getPath("userData"), "connections")
    this.filePath = base + ".enc"
    this.legacyPath = base + ".json"
  }

  private get encryptionAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  async loadFromDisk(): Promise<void> {
    let stored: StoredConnection[]

    try {
      if (fs.existsSync(this.filePath)) {
        if (this.encryptionAvailable) {
          const data = fs.readFileSync(this.filePath)
          const json = safeStorage.decryptString(data)
          stored = JSON.parse(json)
        } else {
          const raw = fs.readFileSync(this.filePath, "utf-8")
          stored = JSON.parse(raw)
        }
      } else if (fs.existsSync(this.legacyPath)) {
        const raw = fs.readFileSync(this.legacyPath, "utf-8")
        stored = JSON.parse(raw)
      } else {
        return
      }
    } catch {
      return
    }

    for (const entry of stored) {
      try {
        await this.connect(entry.name, entry.provider, entry.config)
      } catch (err) {
        console.error(`[ConnectionService] Failed to reconnect ${entry.name}:`, err)
      }
    }
  }

  private saveToDisk(): void {
    const stored: StoredConnection[] = []
    for (const client of this.clients.values()) {
      stored.push({
        id: client.id,
        name: client.name,
        provider: client.provider,
        config: client.config,
      })
    }
    const dir = path.dirname(this.filePath)
    fs.mkdirSync(dir, { recursive: true })
    const json = JSON.stringify(stored)

    if (this.encryptionAvailable) {
      const encrypted = safeStorage.encryptString(json)
      fs.writeFileSync(this.filePath, encrypted)
    } else {
      fs.writeFileSync(this.filePath, json, "utf-8")
    }
  }

  async connect(
    name: string,
    provider: Provider,
    config: Record<string, unknown>
  ): Promise<ConnectionInfo> {
    let client: QueueClient

    switch (provider) {
      case "rabbitmq":
        client = new RabbitMqClient(config as any, name)
        break
      case "sqs":
        client = new AWSSQSClient(config as any, name)
        break
      case "redis":
        client = new RedisStreamClient(config as any, name)
        break
      default:
        throw new Error(`Provider ${provider} not supported`)
    }

    try {
      await client.connect()
    } catch (err) {
      console.error(`[ConnectionService] Failed to connect ${name}:`, err)
    }

    this.clients.set(client.id, client)
    this.saveToDisk()
    return this.toConnectionInfo(client)
  }

  async disconnect(connectionId: string): Promise<void> {
    const client = this.clients.get(connectionId)
    if (!client) throw new Error(`Connection ${connectionId} not found`)
    await client.disconnect()
    this.clients.delete(connectionId)
    this.saveToDisk()
  }

  async clientConnect(connectionId: string): Promise<ConnectionInfo> {
    const client = this.clients.get(connectionId)
    if (!client) throw new Error(`Connection ${connectionId} not found`)
    await client.connect()
    return this.toConnectionInfo(client)
  }

  async clientDisconnect(connectionId: string): Promise<ConnectionInfo> {
    const client = this.clients.get(connectionId)
    if (!client) throw new Error(`Connection ${connectionId} not found`)
    await client.disconnect()
    return this.toConnectionInfo(client)
  }

  getClient(connectionId: string): QueueClient {
    const client = this.clients.get(connectionId)
    if (!client) throw new Error(`Connection ${connectionId} not found`)
    return client
  }

  listConnections(): ConnectionInfo[] {
    return Array.from(this.clients.values()).map((c) => this.toConnectionInfo(c))
  }

  getConnection(connectionId: string): ConnectionInfo | null {
    const client = this.clients.get(connectionId)
    return client ? this.toConnectionInfo(client) : null
  }

  async updateConnection(
    connectionId: string,
    name: string,
    provider: Provider,
    config: Record<string, unknown>
  ): Promise<ConnectionInfo> {
    const oldClient = this.clients.get(connectionId)
    if (oldClient) {
      try {
        await oldClient.disconnect()
      } catch (err) {
        console.error(`[ConnectionService] Error disconnecting old client:`, err)
      }
      this.clients.delete(connectionId)
    }

    return this.connect(name, provider, config)
  }

  private toConnectionInfo(client: QueueClient): ConnectionInfo {
    return {
      id: client.id,
      name: client.name,
      provider: client.provider,
      connected: client.connected,
      config: client.config,
    }
  }
}
