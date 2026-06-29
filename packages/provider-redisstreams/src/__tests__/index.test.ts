import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueueError, QueueErrorCode } from "@easyqueue/core"
import { RedisStreamClient } from "../index"

const mockClient = vi.hoisted(() => ({
  connect: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  keys: vi.fn(),
  type: vi.fn(),
  xReadGroup: vi.fn(),
  xAdd: vi.fn(),
  xAck: vi.fn(),
  xDel: vi.fn(),
  xRange: vi.fn(),
  xGroupCreate: vi.fn(),
}))

vi.mock("redis", () => ({
  createClient: vi.fn(() => mockClient),
}))

const validConfig = { url: "redis://localhost:6379" }

async function connect(client: RedisStreamClient) {
  mockClient.connect.mockResolvedValueOnce(undefined)
  mockClient.xGroupCreate.mockResolvedValueOnce("OK")
  await client.connect()
  vi.clearAllMocks()
}

function createConnected() {
  return new RedisStreamClient(validConfig)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("RedisStreamClient", () => {
  describe("constructor", () => {
    it("should throw if url is missing", () => {
      expect(() => new RedisStreamClient({ url: "" } as any))
        .toThrow(new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "Redis 'url' is required"))
    })

    it("should throw if url is not valid", () => {
      expect(() => new RedisStreamClient({ url: "not-a-url" } as any))
        .toThrow(new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "Redis 'url' must be valid"))
    })

    it("should start disconnected", () => {
      const client = new RedisStreamClient(validConfig)
      expect(client.connected).toBe(false)
    })
  })

  describe("connect", () => {
    it("should connect when redis responds", async () => {
      mockClient.connect.mockResolvedValueOnce(undefined)
      const client = new RedisStreamClient(validConfig)
      await client.connect()
      expect(client.connected).toBe(true)
    })

    it("should throw when redis fails", async () => {
      mockClient.connect.mockRejectedValueOnce(new Error("Connection refused"))
      const client = new RedisStreamClient(validConfig)
      const promise = client.connect()
      await expect(promise).rejects.toMatchObject({
        code: QueueErrorCode.CONNECTION_FAILED,
      })
      expect(client.connected).toBe(false)
    })
  })

  describe("disconnect", () => {
    it("should set connected to false", async () => {
      mockClient.connect.mockResolvedValueOnce(undefined)
      const client = new RedisStreamClient(validConfig)
      await client.connect()
      await client.disconnect()
      expect(client.connected).toBe(false)
    })

    it("should be safe to call when not connected", async () => {
      const client = new RedisStreamClient(validConfig)
      await expect(client.disconnect()).resolves.not.toThrow()
    })
  })

  describe("listQueues", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new RedisStreamClient(validConfig)
      await expect(client.listQueues()).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should return only stream keys", async () => {
      const client = createConnected()
      await connect(client)
      mockClient.keys.mockResolvedValue(["orders", "users", "logs"])
      mockClient.type.mockImplementation((key: string) => {
        if (key === "orders") return Promise.resolve("stream")
        if (key === "logs") return Promise.resolve("stream")
        return Promise.resolve("string")
      })
      const queues = await client.listQueues()
      expect(queues).toHaveLength(2)
      expect(queues[0].name).toBe("orders")
      expect(queues[1].name).toBe("logs")
    })

    it("should throw when redis call fails", async () => {
      const client = createConnected()
      await connect(client)
      mockClient.keys.mockRejectedValueOnce(new Error("Redis error"))
      await expect(client.listQueues()).rejects.toThrow("Redis error")
    })
  })

  describe("listMessages", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new RedisStreamClient(validConfig)
      await expect(client.listMessages("q")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should return messages from xReadGroup", async () => {
      const client = createConnected()
      await connect(client)
      mockClient.xGroupCreate.mockResolvedValue("OK")
      mockClient.xReadGroup.mockResolvedValue([
        {
          name: "test-queue",
          messages: [
            {
              id: "1700000000000-0",
              message: {
                payload: JSON.stringify({ hello: "world" }),
                publishedAt: new Date().toISOString(),
                headers: JSON.stringify({ source: "test" }),
              },
            },
          ],
        },
      ])
      const messages = await client.listMessages("test-queue")
      expect(messages).toHaveLength(1)
      expect(messages[0].payload).toEqual({ hello: "world" })
    })

    it("should return empty array when no messages", async () => {
      const client = createConnected()
      await connect(client)
      mockClient.xGroupCreate.mockResolvedValue("OK")
      mockClient.xReadGroup.mockResolvedValue(null)
      const messages = await client.listMessages("test-queue")
      expect(messages).toHaveLength(0)
    })

    it("should throw when redis call fails", async () => {
      const client = createConnected()
      await connect(client)
      mockClient.xGroupCreate.mockResolvedValue("OK")
      mockClient.xReadGroup.mockRejectedValueOnce(new Error("Redis error"))
      await expect(client.listMessages("test-queue")).rejects.toThrow("Redis error")
    })
  })

  describe("publish", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new RedisStreamClient(validConfig)
      await expect(client.publish({ queue: "q", payload: {} })).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should publish a message successfully", async () => {
      const client = createConnected()
      await connect(client)
      mockClient.xAdd.mockResolvedValue("1700000000000-0")
      await expect(client.publish({ queue: "test-queue", payload: { foo: "bar" } })).resolves.not.toThrow()
    })

    it("should throw when redis call fails", async () => {
      const client = createConnected()
      await connect(client)
      mockClient.xAdd.mockRejectedValueOnce(new Error("Redis error"))
      await expect(client.publish({ queue: "test-queue", payload: {} })).rejects.toThrow("Redis error")
    })
  })

  describe("deleteMessage", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new RedisStreamClient(validConfig)
      await expect(client.deleteMessage("q", "m1")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should be no-op for unknown messageId", async () => {
      const client = createConnected()
      await connect(client)
      await expect(client.deleteMessage("q", "unknown-id")).resolves.not.toThrow()
    })

    it("should ack and delete a fetched message", async () => {
      const client = createConnected()
      await connect(client)
      mockClient.xGroupCreate.mockResolvedValue("OK")
      mockClient.xReadGroup.mockResolvedValue([
        {
          name: "test-queue",
          messages: [
            {
              id: "1700000000000-0",
              message: { payload: "{}", publishedAt: new Date().toISOString() },
            },
          ],
        },
      ])
      await client.listMessages("test-queue")
      mockClient.xAck.mockResolvedValue(1)
      mockClient.xDel.mockResolvedValue(1)
      await expect(client.deleteMessage("test-queue", "1700000000000-0")).resolves.not.toThrow()
      expect(mockClient.xAck).toHaveBeenCalled()
      expect(mockClient.xDel).toHaveBeenCalled()
    })

    it("should throw when redis call fails", async () => {
      const client = createConnected()
      await connect(client)
      mockClient.xGroupCreate.mockResolvedValue("OK")
      mockClient.xReadGroup.mockResolvedValue([
        {
          name: "test-queue",
          messages: [
            {
              id: "1700000000000-0",
              message: { payload: "{}", publishedAt: new Date().toISOString() },
            },
          ],
        },
      ])
      await client.listMessages("test-queue")
      mockClient.xAck.mockRejectedValueOnce(new Error("Redis error"))
      await expect(client.deleteMessage("test-queue", "1700000000000-0")).rejects.toThrow("Redis error")
    })
  })

  describe("releaseMessage", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new RedisStreamClient(validConfig)
      await expect(client.releaseMessage("q", "m1")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should be no-op for unknown messageId", async () => {
      const client = createConnected()
      await connect(client)
      await expect(client.releaseMessage("q", "unknown-id")).resolves.not.toThrow()
    })

    it("should requeue a fetched message", async () => {
      const client = createConnected()
      await connect(client)
      mockClient.xGroupCreate.mockResolvedValue("OK")
      mockClient.xReadGroup.mockResolvedValue([
        {
          name: "test-queue",
          messages: [
            {
              id: "1700000000000-0",
              message: { payload: "{}", publishedAt: new Date().toISOString() },
            },
          ],
        },
      ])
      await client.listMessages("test-queue")
      mockClient.xRange.mockResolvedValue([
        { id: "1700000000000-0", message: { payload: "{}" } },
      ])
      mockClient.xAdd.mockResolvedValue("1700000000001-0")
      mockClient.xAck.mockResolvedValue(1)
      mockClient.xDel.mockResolvedValue(1)
      await expect(client.releaseMessage("test-queue", "1700000000000-0")).resolves.not.toThrow()
      expect(mockClient.xAdd).toHaveBeenCalled()
    })
  })

  describe("releaseQueue", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new RedisStreamClient(validConfig)
      await expect(client.releaseQueue("q")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should requeue all fetched messages for the queue", async () => {
      const client = createConnected()
      await connect(client)
      mockClient.xGroupCreate.mockResolvedValue("OK")
      mockClient.xReadGroup.mockResolvedValue([
        {
          name: "test-queue",
          messages: [
            {
              id: "1700000000000-0",
              message: { payload: "{}", publishedAt: new Date().toISOString() },
            },
          ],
        },
      ])
      await client.listMessages("test-queue")
      mockClient.xRange.mockResolvedValue([])
      mockClient.xDel.mockResolvedValue(1)
      mockClient.xAck.mockResolvedValue(1)
      await expect(client.releaseQueue("test-queue")).resolves.not.toThrow()
    })
  })

  describe("purgeQueue", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new RedisStreamClient(validConfig)
      await expect(client.purgeQueue("q")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should ack and delete all fetched messages for the queue", async () => {
      const client = createConnected()
      await connect(client)
      mockClient.xGroupCreate.mockResolvedValue("OK")
      mockClient.xReadGroup.mockResolvedValue([
        {
          name: "test-queue",
          messages: [
            {
              id: "1700000000000-0",
              message: { payload: "{}", publishedAt: new Date().toISOString() },
            },
          ],
        },
      ])
      await client.listMessages("test-queue")
      mockClient.xAck.mockResolvedValue(1)
      mockClient.xDel.mockResolvedValue(1)
      await expect(client.purgeQueue("test-queue")).resolves.not.toThrow()
      expect(mockClient.xAck).toHaveBeenCalled()
      expect(mockClient.xDel).toHaveBeenCalled()
    })
  })
})
