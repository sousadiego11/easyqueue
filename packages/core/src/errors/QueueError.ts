import { QueueErrorCode } from "./QueueErrorCode"

export class QueueError extends Error {
  public readonly code: QueueErrorCode
  public override readonly cause?: unknown

  constructor(code: QueueErrorCode, message: string, cause?: unknown) {
    super(message, { cause })

    this.name = "QueueError"
    this.code = code
    this.cause = cause

      ; (Error as any).captureStackTrace?.(this, QueueError)
  }
}