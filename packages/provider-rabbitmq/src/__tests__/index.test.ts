import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueueError, QueueErrorCode } from "@easyqueue/core"
import { RabbitMqClient } from "../index"

const mocks = vi.hoisted(() => ({
  mockChannelGet: vi.fn(),
  mockChannelPublish: vi.fn(),
  mockChannelAck: vi.fn(),
  mockChannelNack: vi.fn(),
  mockChannelClose: vi.fn(),
  mockConnectionClose: vi.fn(),
  mockConnectionOn: vi.fn(),
}))

vi.mock("amqplib", () => {
  const mockCreateChannel = vi.fn()

  mockCreateChannel.mockResolvedValue({
    on: vi.fn(),
    close: mocks.mockChannelClose,
    get: mocks.mockChannelGet,
    publish: mocks.mockChannelPublish,
    ack: mocks.mockChannelAck,
    nack: mocks.mockChannelNack,
  })

  return {
    default: {
      connect: vi.fn().mockResolvedValue({
        createChannel: mockCreateChannel,
        connection: { on: mocks.mockConnectionOn, close: mocks.mockConnectionClose },
        close: mocks.mockConnectionClose,
      }),
    },
  }
})

const validConfig = {
  url: "amqp://guest:guest@localhost:5672",
  managementUrl: "http://localhost:15672",
  managementUser: "guest",
  managementPassword: "guest",
}

async function connect(client: RabbitMqClient) {
  await client.connect()
}

function createConnected() {
  return new RabbitMqClient(validConfig)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.mockChannelGet.mockReset()
  mocks.mockChannelPublish.mockReset()
  mocks.mockChannelGet.mockResolvedValue(null)
  mocks.mockChannelPublish.mockReturnValue(true)
  mocks.mockConnectionOn.mockReset()
})

describe("RabbitMqClient", () => {
  describe("constructor", () => {
    it("should throw if url is missing", () => {
      expect(() => new RabbitMqClient({ ...validConfig, url: "" } as any))
        .toThrow(new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "RabbitMQ 'url' is required"))
    })

    it("should throw if managementUrl is missing", () => {
      expect(() => new RabbitMqClient({ ...validConfig, managementUrl: "" } as any))
        .toThrow(new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "RabbitMQ 'managementUrl' is required"))
    })

    it("should throw if managementUser is missing", () => {
      expect(() => new RabbitMqClient({ ...validConfig, managementUser: "" } as any))
        .toThrow(new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "RabbitMQ 'managementUser' is required"))
    })

    it("should throw if managementPassword is missing", () => {
      expect(() => new RabbitMqClient({ ...validConfig, managementPassword: "" } as any))
        .toThrow(new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "RabbitMQ 'managementPassword' is required"))
    })

    it("should throw if url is not valid", () => {
      expect(() => new RabbitMqClient({ ...validConfig, url: "not-a-url" } as any))
        .toThrow(new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "RabbitMQ 'url' must be valid"))
    })

    it("should throw if managementUrl is not valid", () => {
      expect(() => new RabbitMqClient({ ...validConfig, managementUrl: "bad-url" } as any))
        .toThrow(new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "RabbitMQ 'managementUrl' must be valid"))
    })

    it("should start disconnected", () => {
      const client = new RabbitMqClient(validConfig)
      expect(client.connected).toBe(false)
    })
  })

  describe("connect", () => {
    it("should connect and set connected to true", async () => {
      const client = createConnected()
      await connect(client)
      expect(client.connected).toBe(true)
    })

    it("should throw CONNECTION_FAILED when amqplib fails", async () => {
      const amqplib = await import("amqplib")
      vi.mocked((amqplib.default as any).connect).mockRejectedValueOnce(new Error("Connection refused"))
      const client = new RabbitMqClient(validConfig)
      const promise = client.connect()
      await expect(promise).rejects.toThrow(QueueError)
      await expect(promise).rejects.toMatchObject({ code: QueueErrorCode.CONNECTION_FAILED })
      expect(client.connected).toBe(false)
    })
  })

  describe("disconnect", () => {
    it("should set connected to false", async () => {
      const client = createConnected()
      await connect(client)
      await client.disconnect()
      expect(client.connected).toBe(false)
    })

    it("should be safe to call when not connected", async () => {
      const client = new RabbitMqClient(validConfig)
      await expect(client.disconnect()).resolves.not.toThrow()
    })
  })

  describe("listQueues", () => {
    it("should throw when not connected", async () => {
      const client = new RabbitMqClient(validConfig)
      await expect(client.listQueues()).rejects.toMatchObject({
        code: QueueErrorCode.CONNECTION_FAILED,
      })
    })

    it("should return queues from management API", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([{ name: "orders" }, { name: "payments" }]),
        })
      )
      const client = createConnected()
      await connect(client)
      const queues = await client.listQueues()
      expect(queues).toHaveLength(2)
      expect(queues[0].name).toBe("orders")
      expect(queues[1].name).toBe("payments")
      vi.unstubAllGlobals()
    })

    it("should throw when fetch fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, statusText: "Unauthorized" })
      )
      const client = createConnected()
      await connect(client)
      await expect(client.listQueues()).rejects.toMatchObject({
        code: QueueErrorCode.CONNECTION_FAILED,
      })
      vi.unstubAllGlobals()
    })
  })

  describe("listMessages", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new RabbitMqClient(validConfig)
      await expect(client.listMessages("q")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should return messages from channel.get", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockChannelGet.mockResolvedValueOnce({
        content: Buffer.from(JSON.stringify({ hello: "world" })),
        fields: { deliveryTag: 1 },
        properties: { timestamp: Math.floor(Date.now() / 1000), headers: { source: "test" } },
      })
      const messages = await client.listMessages("test-queue")
      expect(messages).toHaveLength(1)
      expect(messages[0].id).toBe("1")
      expect(messages[0].payload).toEqual({ hello: "world" })
    })

    it("should throw when channel.get fails", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockChannelGet.mockRejectedValueOnce(new Error("Channel error"))
      await expect(client.listMessages("test-queue")).rejects.toThrow("Channel error")
    })
  })

  describe("publish", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new RabbitMqClient(validConfig)
      await expect(client.publish({ queue: "q", payload: {} })).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should publish a message successfully", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockChannelPublish.mockReturnValue(true)
      await expect(client.publish({ queue: "test-queue", payload: { foo: "bar" } })).resolves.not.toThrow()
    })

    it("should throw when publish returns false", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockChannelPublish.mockReturnValue(false)
      await expect(client.publish({ queue: "test-queue", payload: {} })).rejects.toMatchObject({
        code: QueueErrorCode.PUBLISH_FAILED,
      })
    })
  })

  describe("deleteMessage", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new RabbitMqClient(validConfig)
      await expect(client.deleteMessage("q", "m1")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should be no-op for unknown messageId", async () => {
      const client = createConnected()
      await connect(client)
      await expect(client.deleteMessage("q", "unknown-id")).resolves.not.toThrow()
    })

    it("should ack a fetched message", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockChannelGet.mockResolvedValueOnce({
        content: Buffer.from("{}"),
        fields: { deliveryTag: 1 },
        properties: { timestamp: Math.floor(Date.now() / 1000) },
      })
      await client.listMessages("test-queue")
      await expect(client.deleteMessage("test-queue", "1")).resolves.not.toThrow()
      expect(mocks.mockChannelAck).toHaveBeenCalled()
    })
  })

  describe("releaseMessage", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new RabbitMqClient(validConfig)
      await expect(client.releaseMessage("q", "m1")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should be no-op for unknown messageId", async () => {
      const client = createConnected()
      await connect(client)
      await expect(client.releaseMessage("q", "unknown-id")).resolves.not.toThrow()
    })

    it("should nack a fetched message", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockChannelGet.mockResolvedValueOnce({
        content: Buffer.from("{}"),
        fields: { deliveryTag: 1 },
        properties: { timestamp: Math.floor(Date.now() / 1000) },
      })
      await client.listMessages("test-queue")
      await expect(client.releaseMessage("test-queue", "1")).resolves.not.toThrow()
      expect(mocks.mockChannelNack).toHaveBeenCalled()
    })
  })

  describe("releaseQueue", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new RabbitMqClient(validConfig)
      await expect(client.releaseQueue("q")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should nack all fetched messages for the queue", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockChannelGet.mockResolvedValueOnce({
        content: Buffer.from("{}"),
        fields: { deliveryTag: 1 },
        properties: { timestamp: Math.floor(Date.now() / 1000) },
      })
      await client.listMessages("test-queue")
      await expect(client.releaseQueue("test-queue")).resolves.not.toThrow()
      expect(mocks.mockChannelNack).toHaveBeenCalled()
    })
  })

  describe("purgeQueue", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new RabbitMqClient(validConfig)
      await expect(client.purgeQueue("q")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should ack all fetched messages for the queue", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockChannelGet.mockResolvedValueOnce({
        content: Buffer.from("{}"),
        fields: { deliveryTag: 1 },
        properties: { timestamp: Math.floor(Date.now() / 1000) },
      })
      await client.listMessages("test-queue")
      await expect(client.purgeQueue("test-queue")).resolves.not.toThrow()
      expect(mocks.mockChannelAck).toHaveBeenCalled()
    })
  })
})
