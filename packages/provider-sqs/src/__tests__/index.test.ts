import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueueError, QueueErrorCode } from "@easyqueue/core"
import { AWSSQSClient } from "../index"

let receiveMessageCallCount = 0

const mockSend = vi.fn()

function makeSendMock() {
  receiveMessageCallCount = 0
  mockSend.mockImplementation((cmd: any) => {
    if (cmd.__type === "ListQueuesCommand") {
      return { QueueUrls: ["https://sqs.us-east-1.amazonaws.com/123/test-queue"] }
    }
    if (cmd.__type === "GetQueueUrlCommand") {
      return { QueueUrl: "https://sqs.us-east-1.amazonaws.com/123/test-queue" }
    }
    if (cmd.__type === "GetQueueAttributesCommand") {
      return {
        Attributes: {
          VisibilityTimeout: "30",
          DelaySeconds: "0",
        },
      }
    }
    if (cmd.__type === "ReceiveMessageCommand") {
      receiveMessageCallCount++
      if (receiveMessageCallCount > 1) return { Messages: [] }
      return {
        Messages: [
          {
            MessageId: "msg-1",
            ReceiptHandle: "rh-1",
            Body: '{"hello":"world"}',
            Attributes: { SentTimestamp: "1700000000000" },
            MessageAttributes: { source: { StringValue: "test" } },
          },
        ],
      }
    }
    if (cmd.__type === "SendMessageCommand") return {}
    if (cmd.__type === "DeleteMessageCommand") return {}
    if (cmd.__type === "ChangeMessageVisibilityCommand") return {}
    return {}
  })
}

vi.mock("@aws-sdk/client-sqs", () => {
  const makeCommand = (type: string) =>
    vi.fn(function (this: any, params: any) {
      this.__type = type
      this.params = params
    })

  return {
    SQSClient: vi.fn(function () {
      return { send: mockSend, destroy: vi.fn() }
    }),
    ListQueuesCommand: makeCommand("ListQueuesCommand"),
    GetQueueUrlCommand: makeCommand("GetQueueUrlCommand"),
    GetQueueAttributesCommand: makeCommand("GetQueueAttributesCommand"),
    ReceiveMessageCommand: makeCommand("ReceiveMessageCommand"),
    SendMessageCommand: makeCommand("SendMessageCommand"),
    DeleteMessageCommand: makeCommand("DeleteMessageCommand"),
    ChangeMessageVisibilityCommand: makeCommand("ChangeMessageVisibilityCommand"),
  }
})

const validConfig = {
  region: "us-east-1",
  accessKeyId: "AKIA123",
  secretAccessKey: "secret123",
}

function createConnected() {
  return new AWSSQSClient(validConfig)
}

async function connect(client: AWSSQSClient) {
  await client.connect()
}

beforeEach(() => {
  vi.clearAllMocks()
  receiveMessageCallCount = 0
  makeSendMock()
})

describe("AWSSQSClient", () => {
  describe("constructor", () => {
    it("should throw if region is missing", () => {
      expect(() => new AWSSQSClient({ ...validConfig, region: "" } as any))
        .toThrow(new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "SQS 'region' is required"))
    })

    it("should throw if accessKeyId is missing", () => {
      expect(() => new AWSSQSClient({ ...validConfig, accessKeyId: "" } as any))
        .toThrow(new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "SQS 'accessKeyId' is required"))
    })

    it("should throw if secretAccessKey is missing", () => {
      expect(() => new AWSSQSClient({ ...validConfig, secretAccessKey: "" } as any))
        .toThrow(new QueueError(QueueErrorCode.INVALID_CONFIGURATION, "SQS 'secretAccessKey' is required"))
    })

    it("should start disconnected", () => {
      const client = new AWSSQSClient(validConfig)
      expect(client.connected).toBe(false)
    })
  })

  describe("connect", () => {
    it("should connect when SQS responds", async () => {
      const client = createConnected()
      await connect(client)
      expect(client.connected).toBe(true)
    })

    it("should throw CONNECTION_FAILED when SQS fails", async () => {
      mockSend.mockRejectedValueOnce(new Error("Network error"))
      const client = new AWSSQSClient(validConfig)
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
      const client = new AWSSQSClient(validConfig)
      await expect(client.disconnect()).resolves.not.toThrow()
    })
  })

  describe("listQueues", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new AWSSQSClient(validConfig)
      await expect(client.listQueues()).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should return a list of queues", async () => {
      const client = createConnected()
      await connect(client)
      const queues = await client.listQueues()
      expect(queues).toHaveLength(1)
      expect(queues[0].name).toBe("test-queue")
    })

    it("should throw when SQS call fails", async () => {
      const client = createConnected()
      await connect(client)
      mockSend.mockRejectedValueOnce(new Error("Service error"))
      await expect(client.listQueues()).rejects.toThrow("Service error")
    })
  })

  describe("listMessages", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new AWSSQSClient(validConfig)
      await expect(client.listMessages("q")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should return messages", async () => {
      const client = createConnected()
      await connect(client)
      const messages = await client.listMessages("test-queue")
      expect(messages).toHaveLength(1)
      expect(messages[0].id).toBe("msg-1")
      expect(messages[0].queue).toBe("test-queue")
      expect(messages[0].payload).toEqual({ hello: "world" })
    })

    it("should throw when SQS call fails", async () => {
      const client = createConnected()
      await connect(client)
      mockSend.mockRejectedValueOnce(new Error("Service error"))
      await expect(client.listMessages("test-queue")).rejects.toThrow("Service error")
    })
  })

  describe("publish", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new AWSSQSClient(validConfig)
      await expect(client.publish({ queue: "q", payload: {} })).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should publish a message successfully", async () => {
      const client = createConnected()
      await connect(client)
      await expect(client.publish({ queue: "test-queue", payload: { foo: "bar" } })).resolves.not.toThrow()
    })

    it("should throw when SQS call fails", async () => {
      const client = createConnected()
      await connect(client)
      mockSend.mockRejectedValueOnce(new Error("Service error"))
      await expect(client.publish({ queue: "test-queue", payload: {} })).rejects.toThrow("Service error")
    })
  })

  describe("deleteMessage", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new AWSSQSClient(validConfig)
      await expect(client.deleteMessage("q", "m1")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should be no-op for unknown messageId", async () => {
      const client = createConnected()
      await connect(client)
      await expect(client.deleteMessage("q", "unknown-id")).resolves.not.toThrow()
    })

    it("should delete a fetched message", async () => {
      const client = createConnected()
      await connect(client)
      mockSend.mockClear()
      await client.listMessages("test-queue")
      mockSend.mockResolvedValue({})
      await expect(client.deleteMessage("test-queue", "msg-1")).resolves.not.toThrow()
    })

    it("should throw when SQS call fails", async () => {
      const client = createConnected()
      await connect(client)
      await client.listMessages("test-queue")
      mockSend.mockRejectedValueOnce(new Error("Service error"))
      await expect(client.deleteMessage("test-queue", "msg-1")).rejects.toThrow("Service error")
    })
  })

  describe("releaseMessage", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new AWSSQSClient(validConfig)
      await expect(client.releaseMessage("q", "m1")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should be no-op for unknown messageId", async () => {
      const client = createConnected()
      await connect(client)
      await expect(client.releaseMessage("q", "unknown-id")).resolves.not.toThrow()
    })

    it("should release a fetched message", async () => {
      const client = createConnected()
      await connect(client)
      mockSend.mockClear()
      await client.listMessages("test-queue")
      mockSend.mockResolvedValue({})
      await expect(client.releaseMessage("test-queue", "msg-1")).resolves.not.toThrow()
    })

    it("should throw when SQS call fails", async () => {
      const client = createConnected()
      await connect(client)
      await client.listMessages("test-queue")
      mockSend.mockRejectedValueOnce(new Error("Service error"))
      await expect(client.releaseMessage("test-queue", "msg-1")).rejects.toThrow("Service error")
    })
  })

  describe("releaseQueue", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new AWSSQSClient(validConfig)
      await expect(client.releaseQueue("q")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should release all fetched messages in the queue", async () => {
      const client = createConnected()
      await connect(client)
      mockSend.mockClear()
      await client.listMessages("test-queue")
      mockSend.mockResolvedValue({})
      await expect(client.releaseQueue("test-queue")).resolves.not.toThrow()
    })
  })

  describe("purgeQueue", () => {
    it("should throw PROVIDER_NOT_CONNECTED when not connected", async () => {
      const client = new AWSSQSClient(validConfig)
      await expect(client.purgeQueue("q")).rejects.toMatchObject({
        code: QueueErrorCode.PROVIDER_NOT_CONNECTED,
      })
    })

    it("should purge all fetched messages in the queue", async () => {
      const client = createConnected()
      await connect(client)
      mockSend.mockClear()
      await client.listMessages("test-queue")
      mockSend.mockResolvedValue({})
      await expect(client.purgeQueue("test-queue")).resolves.not.toThrow()
    })
  })
})
