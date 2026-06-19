export function trimPayload(payload: unknown): string {
  const text = JSON.stringify(payload)
  return text.length > 80 ? text.slice(0, 80) + "\u2026" : text
}

export function getMessageSize(msg: { payload: unknown }): number {
  return JSON.stringify(msg.payload).length
}

export function formatSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`
  if (bytes < 1000000) return `${(bytes / 1000).toFixed(1)} KB`
  return `${(bytes / 1000000).toFixed(1)} MB`
}
