import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueueError, QueueErrorCode } from "@easyqueue/core"
import { AzureServiceBusClient } from "../index"

const mocks = vi.hoisted(() => ({
  mockReceiveMessages: vi.fn(),
  mockCompleteMessage: vi.fn(),
  mockAbandonMessage: vi.fn(),
  mockSendMessages: vi.fn(),
  mockCloseClient: vi.fn(),
  mockCloseReceiver: vi.fn(),
  mockCloseSender: vi.fn(),
  mockFetch: vi.fn(),
}))

vi.mock("@azure/service-bus", () => {
  const mockCreateReceiver = vi.fn()
  const mockCreateSender = vi.fn()

  mockCreateReceiver.mockReturnValue({
    receiveMessages: mocks.mockReceiveMessages,
    completeMessage: mocks.mockCompleteMessage,
    abandonMessage: mocks.mockAbandonMessage,
    close: mocks.mockCloseReceiver,
  })

  mockCreateSender.mockReturnValue({
    sendMessages: mocks.mockSendMessages,
    close: mocks.mockCloseSender,
  })

  return {
    ServiceBusClient: vi.fn(function () {
      return {
        createReceiver: mockCreateReceiver,
        createSender: mockCreateSender,
        close: mocks.mockCloseClient,
      }
    }),
  }
})

const validConfig = {
  connectionString: "Endpoint=sb://testns.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=fakekey",
}

async function connect(client: AzureServiceBusClient) {
  await client.connect()
}

function createConnected() {
  return new AzureServiceBusClient(validConfig)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.mockReceiveMessages.mockReset()
  mocks.mockCompleteMessage.mockReset()
  mocks.mockAbandonMessage.mockReset()
  mocks.mockSendMessages.mockReset()
  mocks.mockFetch.mockReset()
  mocks.mockReceiveMessages.mockResolvedValue([])
  mocks.mockSendMessages.mockResolvedValue(undefined)
  mocks.mockFetch.mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(JSON.stringify({ value: [] })),
  } as unknown as Response)
  vi.stubGlobal("fetch", mocks.mockFetch)
})

describe("AzureServiceBusClient", () => {
  describe("constructor", () => {
    it("should throw if connectionString is missing", () => {
      expect(() => new AzureServiceBusClient({ ...validConfig, connectionString: "" } as any))
        .toThrow(new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "Azure 'connectionString' is required"))
    })

    it("should throw if connectionString is not provided", () => {
      expect(() => new AzureServiceBusClient({} as any))
        .toThrow(new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "Azure 'connectionString' is required"))
    })

    it("should start disconnected", () => {
      const client = new AzureServiceBusClient(validConfig)
      expect(client.connected).toBe(false)
    })
  })

  describe("connect", () => {
    it("should connect and set connected to true", async () => {
      const client = createConnected()
      await connect(client)
      expect(client.connected).toBe(true)
    })

    it("should throw CONNECTION_FAILED when Azure SDK fails", async () => {
      const azure = await import("@azure/service-bus")
      vi.mocked(azure.ServiceBusClient as any).mockImplementationOnce(function () {
        throw new Error("Connection refused")
      })
      const client = new AzureServiceBusClient(validConfig)
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
      const client = new AzureServiceBusClient(validConfig)
      await expect(client.disconnect()).resolves.not.toThrow()
    })
  })

  describe("listQueues", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new AzureServiceBusClient(validConfig)
      await expect(client.listQueues()).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should return a list of queues", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ value: [{ name: "orders" }, { name: "payments" }] })),
      } as unknown as Response)
      const queues = await client.listQueues()
      expect(queues).toHaveLength(2)
      expect(queues[0].name).toBe("orders")
      expect(queues[1].name).toBe("payments")
    })

    it("should throw when Azure call fails", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve(""),
      } as unknown as Response)
      await expect(client.listQueues()).rejects.toMatchObject({ code: QueueErrorCode.UNKNOWN })
    })

    it("should parse Atom XML feed", async () => {
      const client = createConnected()
      await connect(client)
      const xml = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title type="text">Queues</title>
  <entry>
    <title type="text">orders</title>
  </entry>
  <entry>
    <title type="text">payments</title>
  </entry>
</feed>`
      mocks.mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(xml),
      } as unknown as Response)
      const queues = await client.listQueues()
      expect(queues).toHaveLength(2)
      expect(queues[0].name).toBe("orders")
      expect(queues[1].name).toBe("payments")
    })
  })

  describe("listMessages", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new AzureServiceBusClient(validConfig)
      await expect(client.listMessages("q")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should return messages", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockReceiveMessages.mockResolvedValue([
        {
          messageId: "msg-1",
          body: { hello: "world" },
          enqueuedTimeUtc: new Date("2026-01-01T00:00:00Z"),
          sequenceNumber: 1,
          lockToken: "lock-1",
          deliveryCount: 1,
          applicationProperties: { source: "test" },
        },
      ])
      const messages = await client.listMessages("test-queue")
      expect(messages).toHaveLength(1)
      expect(messages[0].id).toBe("msg-1")
      expect(messages[0].queue).toBe("test-queue")
      expect(messages[0].payload).toEqual({ hello: "world" })
    })

    it("should throw when Azure call fails", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockReceiveMessages.mockRejectedValueOnce(new Error("Service error"))
      await expect(client.listMessages("test-queue")).rejects.toThrow("Service error")
    })
  })

  describe("publish", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new AzureServiceBusClient(validConfig)
      await expect(client.publish({ queue: "q", payload: {} })).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should publish a message successfully", async () => {
      const client = createConnected()
      await connect(client)
      await expect(client.publish({ queue: "test-queue", payload: { foo: "bar" } })).resolves.not.toThrow()
    })

    it("should throw when Azure call fails", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockSendMessages.mockRejectedValueOnce(new Error("Service error"))
      await expect(client.publish({ queue: "test-queue", payload: {} })).rejects.toThrow("Service error")
    })
  })

  describe("deleteMessage", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new AzureServiceBusClient(validConfig)
      await expect(client.deleteMessage("q", "m1")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should be no-op for unknown messageId", async () => {
      const client = createConnected()
      await connect(client)
      await expect(client.deleteMessage("q", "unknown-id")).resolves.not.toThrow()
    })

    it("should complete a fetched message", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockReceiveMessages.mockResolvedValueOnce([
        {
          messageId: "1",
          body: {},
          enqueuedTimeUtc: new Date(),
          sequenceNumber: 1,
          lockToken: "lock-1",
          deliveryCount: 0,
        },
      ])
      await client.listMessages("test-queue")
      await expect(client.deleteMessage("test-queue", "1")).resolves.not.toThrow()
      expect(mocks.mockCompleteMessage).toHaveBeenCalled()
    })

    it("should throw when Azure call fails", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockReceiveMessages.mockResolvedValueOnce([
        {
          messageId: "1",
          body: {},
          enqueuedTimeUtc: new Date(),
          sequenceNumber: 1,
          lockToken: "lock-1",
          deliveryCount: 0,
        },
      ])
      await client.listMessages("test-queue")
      mocks.mockCompleteMessage.mockRejectedValueOnce(new Error("Service error"))
      await expect(client.deleteMessage("test-queue", "1")).rejects.toThrow("Service error")
    })
  })

  describe("releaseMessage", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new AzureServiceBusClient(validConfig)
      await expect(client.releaseMessage("q", "m1")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should be no-op for unknown messageId", async () => {
      const client = createConnected()
      await connect(client)
      await expect(client.releaseMessage("q", "unknown-id")).resolves.not.toThrow()
    })

    it("should abandon a fetched message", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockReceiveMessages.mockResolvedValueOnce([
        {
          messageId: "1",
          body: {},
          enqueuedTimeUtc: new Date(),
          sequenceNumber: 1,
          lockToken: "lock-1",
          deliveryCount: 0,
        },
      ])
      await client.listMessages("test-queue")
      await expect(client.releaseMessage("test-queue", "1")).resolves.not.toThrow()
      expect(mocks.mockAbandonMessage).toHaveBeenCalled()
    })

    it("should throw when Azure call fails", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockReceiveMessages.mockResolvedValueOnce([
        {
          messageId: "1",
          body: {},
          enqueuedTimeUtc: new Date(),
          sequenceNumber: 1,
          lockToken: "lock-1",
          deliveryCount: 0,
        },
      ])
      await client.listMessages("test-queue")
      mocks.mockAbandonMessage.mockRejectedValueOnce(new Error("Service error"))
      await expect(client.releaseMessage("test-queue", "1")).rejects.toThrow("Service error")
    })
  })

  describe("releaseQueue", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new AzureServiceBusClient(validConfig)
      await expect(client.releaseQueue("q")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should abandon all fetched messages in the queue", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockReceiveMessages.mockResolvedValueOnce([
        {
          messageId: "1",
          body: {},
          enqueuedTimeUtc: new Date(),
          sequenceNumber: 1,
          lockToken: "lock-1",
          deliveryCount: 0,
        },
      ])
      await client.listMessages("test-queue")
      await expect(client.releaseQueue("test-queue")).resolves.not.toThrow()
      expect(mocks.mockAbandonMessage).toHaveBeenCalled()
    })
  })

  describe("purgeQueue", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new AzureServiceBusClient(validConfig)
      await expect(client.purgeQueue("q")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should complete all fetched messages in the queue", async () => {
      const client = createConnected()
      await connect(client)
      mocks.mockReceiveMessages.mockResolvedValueOnce([
        {
          messageId: "1",
          body: {},
          enqueuedTimeUtc: new Date(),
          sequenceNumber: 1,
          lockToken: "lock-1",
          deliveryCount: 0,
        },
      ])
      await client.listMessages("test-queue")
      await expect(client.purgeQueue("test-queue")).resolves.not.toThrow()
      expect(mocks.mockCompleteMessage).toHaveBeenCalled()
    })
  })
})
