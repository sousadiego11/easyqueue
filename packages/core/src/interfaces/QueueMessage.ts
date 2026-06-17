export interface QueueMessage {
    id: string
    queue: string
    payload: unknown
    timestamp: Date
    headers?: Record<string, string>
    raw?: unknown
}
