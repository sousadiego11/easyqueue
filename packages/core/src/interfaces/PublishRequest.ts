export interface PublishRequest {
    queue: string
    payload: unknown
    headers?: Record<string, string>
}
