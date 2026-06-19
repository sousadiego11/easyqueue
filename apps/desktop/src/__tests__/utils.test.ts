import { describe, it, expect } from "vitest"
import { cn, getErrorMessage } from "@/lib/utils"
import { trimPayload, getMessageSize, formatSize } from "@/lib/messageUtils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })

  it("merges tailwind classes correctly (later wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })
})

describe("getErrorMessage", () => {
  it("returns message from Error instance", () => {
    expect(getErrorMessage(new Error("oops"), "fallback")).toBe("oops")
  })

  it("returns fallback for non-Error values", () => {
    expect(getErrorMessage("string error", "fallback")).toBe("fallback")
    expect(getErrorMessage(null, "fallback")).toBe("fallback")
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback")
    expect(getErrorMessage({ foo: "bar" }, "fallback")).toBe("fallback")
  })
})

describe("trimPayload", () => {
  it("returns full text for short payloads", () => {
    expect(trimPayload({ key: "hi" })).toBe('{"key":"hi"}')
  })

  it("truncates payloads over 80 chars with ellipsis", () => {
    const longPayload = { data: "a".repeat(100) }
    const result = trimPayload(longPayload)
    expect(result).toHaveLength(81)
    expect(result.endsWith("\u2026")).toBe(true)
  })
})

describe("getMessageSize", () => {
  it("returns stringified length", () => {
    expect(getMessageSize({ payload: { x: 1 } })).toBe(JSON.stringify({ x: 1 }).length)
  })
})

describe("formatSize", () => {
  it("formats bytes", () => {
    expect(formatSize(500)).toBe("500 B")
  })

  it("formats kilobytes", () => {
    expect(formatSize(1500)).toBe("1.5 KB")
  })

  it("formats megabytes", () => {
    expect(formatSize(2500000)).toBe("2.5 MB")
  })

  it("handles edge boundary", () => {
    expect(formatSize(999)).toBe("999 B")
    expect(formatSize(1000)).toBe("1.0 KB")
  })
})
