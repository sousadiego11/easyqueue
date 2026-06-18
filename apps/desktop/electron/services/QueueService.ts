import type { QueueInfo, QueueMessage } from "@easyqueue/core"
import { ConnectionService } from "./ConnectionService"

export class QueueService {
  constructor(private connectionService: ConnectionService) {}

  async listQueues(connectionId: string): Promise<QueueInfo[]> {
    const client = this.connectionService.getClient(connectionId)
    return client.listQueues()
  }

  async listMessages(connectionId: string, queue: string, limit?: number): Promise<QueueMessage[]> {
    const client = this.connectionService.getClient(connectionId)
    return client.listMessages(queue, limit)
  }
}
