import { describe, it, expect } from "vitest"
import { QueueError, QueueErrorCode } from "@easyqueue/core"
import { IPC_CHANNELS } from "@easyqueue/shared"

describe("QueueError", () => {
  it("creates error with code and message", () => {
    const err = new QueueError(QueueErrorCode.CONNECTION_FAILED, "could not connect")
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe("QueueError")
    expect(err.code).toBe(QueueErrorCode.CONNECTION_FAILED)
    expect(err.message).toBe("could not connect")
  })

  it("stores cause when provided", () => {
    const cause = new Error("timeout")
    const err = new QueueError(QueueErrorCode.CONNECTION_FAILED, "failed", cause)
    expect(err.cause).toBe(cause)
  })

  it("has stack trace", () => {
    const err = new QueueError(QueueErrorCode.UNKNOWN, "oops")
    expect(err.stack).toBeTruthy()
  })
})

describe("QueueErrorCode", () => {
  it("has expected enum values", () => {
    expect(QueueErrorCode.INVALID_CONFIGURATION).toBe(0)
    expect(QueueErrorCode.CONNECTION_FAILED).toBe(1)
    expect(QueueErrorCode.AUTHENTICATION_FAILED).toBe(2)
    expect(QueueErrorCode.UNSUPPORTED_PROVIDER).toBe(3)
    expect(QueueErrorCode.PROVIDER_NOT_CONNECTED).toBe(4)
    expect(QueueErrorCode.PUBLISH_FAILED).toBe(5)
    expect(QueueErrorCode.UNKNOWN).toBe(6)
  })
})

describe("IPC_CHANNELS", () => {
  it("contains all expected channel names", () => {
    expect(IPC_CHANNELS.CONNECT).toBe("queue:connect")
    expect(IPC_CHANNELS.DISCONNECT).toBe("queue:disconnect")
    expect(IPC_CHANNELS.LIST_QUEUES).toBe("queue:list-queues")
    expect(IPC_CHANNELS.LIST_MESSAGES).toBe("queue:list-messages")
    expect(IPC_CHANNELS.PUBLISH).toBe("queue:publish")
    expect(IPC_CHANNELS.DELETE_MESSAGE).toBe("queue:delete-message")
    expect(IPC_CHANNELS.RELEASE_MESSAGE).toBe("queue:release-message")
    expect(IPC_CHANNELS.RELEASE_QUEUE).toBe("queue:release-queue")
    expect(IPC_CHANNELS.PURGE_QUEUE).toBe("queue:purge-queue")
    expect(IPC_CHANNELS.CONNECTION_STATE_CHANGED).toBe("queue:connection-state-changed")
    expect(IPC_CHANNELS.CLIENT_CONNECT).toBe("queue:client-connect")
    expect(IPC_CHANNELS.CLIENT_DISCONNECT).toBe("queue:client-disconnect")
    expect(IPC_CHANNELS.LIST_CONNECTIONS).toBe("queue:list-connections")
    expect(IPC_CHANNELS.UPDATE_CONNECTION).toBe("queue:update-connection")
    expect(IPC_CHANNELS.DELETE_CONNECTION).toBe("queue:delete-connection")
    expect(IPC_CHANNELS.WINDOW_MINIMIZE).toBe("window:minimize")
    expect(IPC_CHANNELS.WINDOW_MAXIMIZE).toBe("window:maximize")
    expect(IPC_CHANNELS.WINDOW_CLOSE).toBe("window:close")
  })

  it("has correct number of channels", () => {
    expect(Object.keys(IPC_CHANNELS)).toHaveLength(18)
  })
})
