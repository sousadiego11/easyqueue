import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { MockProvider } from "./MockProvider"
import fs from "fs"
import path from "path"
import os from "os"

const testDir = path.join(os.tmpdir(), "easyqueue-test-connections")
const testFile = path.join(testDir, "connections")

const mockEncryptionAvailable = vi.fn().mockReturnValue(false)

vi.mock("electron", () => ({
  app: { getPath: () => testDir },
  safeStorage: {
    isEncryptionAvailable: () => mockEncryptionAvailable(),
    encryptString: (s: string) => Buffer.from(s),
    decryptString: (b: Buffer) => b.toString(),
  },
}))

class MockRabbitMqClient extends MockProvider { provider = "rabbitmq" as const }
class MockAWSSQSClient extends MockProvider { provider = "sqs" as const }
class MockRedisStreamClient extends MockProvider { provider = "redis" as const }
class MockAzureServiceBusClient extends MockProvider { provider = "azureservicebus" as const }
class MockNatsJetStreamClient extends MockProvider { provider = "natsjetstream" as const }

vi.mock("@easyqueue/provider-rabbitmq", () => ({ RabbitMqClient: MockRabbitMqClient }))
vi.mock("@easyqueue/provider-sqs", () => ({ AWSSQSClient: MockAWSSQSClient }))
vi.mock("@easyqueue/provider-redisstreams", () => ({ RedisStreamClient: MockRedisStreamClient }))
vi.mock("@easyqueue/provider-azureservicebus", () => ({ AzureServiceBusClient: MockAzureServiceBusClient }))
vi.mock("@easyqueue/provider-natsjetstream", () => ({ NatsJetStreamClient: MockNatsJetStreamClient }))

const { ConnectionService } = await import("../../electron/services/ConnectionService")

function cleanDir(dir: string) {
  try { fs.rmSync(dir, { recursive: true, force: true }) } catch { /* ok */ }
}

describe("ConnectionService", () => {
  let service: ConnectionService

  beforeEach(() => {
    cleanDir(testDir)
    mockEncryptionAvailable.mockReturnValue(false)
    service = new ConnectionService(testFile)
  })

  afterEach(() => {
    cleanDir(testDir)
  })

  describe("constructor", () => {
    it("sets file paths from argument", () => {
      const s = new ConnectionService("/custom/path/conn")
      expect((s as any).filePath).toBe("/custom/path/conn.enc")
      expect((s as any).legacyPath).toBe("/custom/path/conn.json")
    })

    it("starts with no clients", () => {
      expect(service.listConnections()).toEqual([])
    })
  })

  describe("connect", () => {
    it("creates a connection and returns ConnectionInfo", async () => {
      const info = await service.connect("Test", "sqs", { region: "us-east-1" })
      expect(info.name).toBe("Test")
      expect(info.provider).toBe("sqs")
      expect(info.connected).toBe(true)
      expect(info.id).toBeTruthy()
      expect(info.config).toEqual({ region: "us-east-1" })
    })

    it("persists to disk", async () => {
      await service.connect("Test", "sqs", {})
      const s2 = new ConnectionService(testFile)
      await s2.loadFromDisk()
      expect(s2.listConnections()).toHaveLength(1)
      expect(s2.listConnections()[0].name).toBe("Test")
    })

    it("allows multiple connections", async () => {
      await service.connect("A", "sqs", {})
      await service.connect("B", "rabbitmq", {})
      expect(service.listConnections()).toHaveLength(2)
    })

    it("does not throw if client.connect fails", async () => {
      const spy = vi.spyOn(MockAWSSQSClient.prototype, "connect")
        .mockRejectedValueOnce(new Error("refused"))
      const info = await service.connect("Fail", "sqs", {})
      expect(info.connected).toBe(false)
      spy.mockRestore()
    })
  })

  describe("disconnect", () => {
    it("removes a connection", async () => {
      const conn = await service.connect("Test", "sqs", {})
      await service.disconnect(conn.id)
      expect(service.listConnections()).toHaveLength(0)
    })

    it("throws when connection does not exist", async () => {
      await expect(service.disconnect("nonexistent")).rejects.toThrow("not found")
    })

    it("disconnects the client before removing", async () => {
      const conn = await service.connect("Test", "sqs", {})
      const client = service.getClient(conn.id)
      await service.disconnect(conn.id)
      expect(client.connected).toBe(false)
    })

    it("persists removal to disk", async () => {
      const conn = await service.connect("Test", "sqs", {})
      await service.disconnect(conn.id)
      const s2 = new ConnectionService(testFile)
      await s2.loadFromDisk()
      expect(s2.listConnections()).toHaveLength(0)
    })
  })

  describe("clientConnect", () => {
    it("reconnects a disconnected client", async () => {
      const conn = await service.connect("Test", "sqs", {})
      await service.clientDisconnect(conn.id)
      const updated = await service.clientConnect(conn.id)
      expect(updated.connected).toBe(true)
    })

    it("throws when connection does not exist", async () => {
      await expect(service.clientConnect("nonexistent")).rejects.toThrow("not found")
    })
  })

  describe("clientDisconnect", () => {
    it("disconnects without removing", async () => {
      const conn = await service.connect("Test", "sqs", {})
      const updated = await service.clientDisconnect(conn.id)
      expect(updated.connected).toBe(false)
      expect(service.listConnections()).toHaveLength(1)
    })

    it("throws when connection does not exist", async () => {
      await expect(service.clientDisconnect("nonexistent")).rejects.toThrow("not found")
    })
  })

  describe("getClient", () => {
    it("returns the client for a valid id", async () => {
      const conn = await service.connect("Test", "sqs", {})
      const client = service.getClient(conn.id)
      expect(client.id).toBe(conn.id)
      expect(client.name).toBe("Test")
    })

    it("throws when connection does not exist", () => {
      expect(() => service.getClient("nonexistent")).toThrow("not found")
    })
  })

  describe("getConnection", () => {
    it("returns ConnectionInfo for a valid id", async () => {
      const conn = await service.connect("Test", "sqs", {})
      const result = service.getConnection(conn.id)
      expect(result).not.toBeNull()
      expect(result!.id).toBe(conn.id)
    })

    it("returns null when connection does not exist", () => {
      expect(service.getConnection("nonexistent")).toBeNull()
    })
  })

  describe("listConnections", () => {
    it("returns empty array initially", () => {
      expect(service.listConnections()).toEqual([])
    })

    it("returns all connections", async () => {
      await service.connect("A", "sqs", {})
      await service.connect("B", "redis", {})
      expect(service.listConnections()).toHaveLength(2)
    })

    it("returns ConnectionInfo objects with correct shape", async () => {
      await service.connect("Test", "sqs", { region: "us-east-1" })
      const info = service.listConnections()[0]
      expect(info).toHaveProperty("id")
      expect(info).toHaveProperty("name")
      expect(info).toHaveProperty("provider")
      expect(info).toHaveProperty("connected")
      expect(info).toHaveProperty("config")
    })
  })

  describe("deleteConnection", () => {
    it("removes a connection from the service", async () => {
      const conn = await service.connect("Test", "sqs", {})
      expect(service.listConnections()).toHaveLength(1)
      await service.deleteConnection(conn.id)
      expect(service.listConnections()).toHaveLength(0)
    })

    it("throws when connection does not exist", async () => {
      await expect(service.deleteConnection("nonexistent")).rejects.toThrow("not found")
    })

    it("disconnects the client before removing", async () => {
      const conn = await service.connect("Test", "sqs", {})
      const client = service.getClient(conn.id)
      expect(client.connected).toBe(true)
      await service.deleteConnection(conn.id)
      expect(client.connected).toBe(false)
    })

    it("persists the removal to disk", async () => {
      const conn = await service.connect("Test", "sqs", {})
      await service.deleteConnection(conn.id)
      const s2 = new ConnectionService(testFile)
      await s2.loadFromDisk()
      expect(s2.listConnections()).toHaveLength(0)
    })

    it("does not throw if client.disconnect fails", async () => {
      const conn = await service.connect("Test", "sqs", {})
      const spy = vi.spyOn(MockAWSSQSClient.prototype, "disconnect")
        .mockRejectedValueOnce(new Error("network error"))
      await expect(service.deleteConnection(conn.id)).resolves.not.toThrow()
      expect(service.listConnections()).toHaveLength(0)
      spy.mockRestore()
    })
  })

  describe("updateConnection", () => {
    it("replaces an existing connection", async () => {
      const old = await service.connect("Old", "sqs", { region: "us-east-1" })
      const updated = await service.updateConnection(old.id, "New", "rabbitmq", { url: "amqp://..." })
      expect(updated.name).toBe("New")
      expect(updated.provider).toBe("rabbitmq")
      expect(service.listConnections()).toHaveLength(1)
      expect(service.listConnections()[0].name).toBe("New")
    })

    it("creates a new connection if old id does not exist", async () => {
      const updated = await service.updateConnection("nonexistent", "New", "sqs", {})
      expect(updated.name).toBe("New")
      expect(service.listConnections()).toHaveLength(1)
    })

    it("disconnects the old client before replacing", async () => {
      const old = await service.connect("Old", "sqs", {})
      const oldClient = service.getClient(old.id)
      await service.updateConnection(old.id, "New", "sqs", {})
      expect(oldClient.connected).toBe(false)
    })
  })

  describe("loadFromDisk", () => {
    it("loads nothing when no files exist", async () => {
      await service.loadFromDisk()
      expect(service.listConnections()).toHaveLength(0)
    })

    it("loads from encrypted file when encryption is available", async () => {
      mockEncryptionAvailable.mockReturnValue(true)
      const s1 = new ConnectionService(testFile)
      await s1.connect("Test", "sqs", {})
      const s2 = new ConnectionService(testFile)
      await s2.loadFromDisk()
      expect(s2.listConnections()).toHaveLength(1)
      expect(s2.listConnections()[0].name).toBe("Test")
    })

    it("handles corrupted file gracefully", async () => {
      fs.mkdirSync(testDir, { recursive: true })
      fs.writeFileSync(testFile + ".enc", "not-json")
      await expect(service.loadFromDisk()).resolves.not.toThrow()
      expect(service.listConnections()).toHaveLength(0)
    })

    it("loads from legacy json file", async () => {
      const s1 = new ConnectionService(testFile)
      await s1.connect("Legacy", "sqs", {})
      const data = fs.readFileSync(testFile + ".enc")
      fs.rmSync(testFile + ".enc")
      fs.writeFileSync(testFile + ".json", data)
      const s2 = new ConnectionService(testFile)
      await s2.loadFromDisk()
      expect(s2.listConnections()).toHaveLength(1)
      expect(s2.listConnections()[0].name).toBe("Legacy")
    })
  })
})
