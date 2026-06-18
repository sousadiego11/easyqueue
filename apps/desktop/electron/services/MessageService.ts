import { ConnectionService } from "./ConnectionService"

export class MessageService {
  constructor(private connectionService: ConnectionService) {}

  async publish(
    connectionId: string,
    queue: string,
    payload: unknown,
    headers?: Record<string, string>
  ): Promise<void> {
    const client = this.connectionService.getClient(connectionId)
    await client.publish({ queue, payload, headers })
  }

  async deleteMessage(connectionId: string, queue: string, messageId: string): Promise<void> {
    const client = this.connectionService.getClient(connectionId)
    await client.deleteMessage(queue, messageId)
  }

  async purgeQueue(connectionId: string, queue: string): Promise<void> {
    const client = this.connectionService.getClient(connectionId)
    await client.purgeQueue(queue)
  }
}
