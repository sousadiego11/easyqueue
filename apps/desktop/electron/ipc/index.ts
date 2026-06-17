import type { ConnectionService } from "../services/ConnectionService"
import type { QueueService } from "../services/QueueService"
import type { MessageService } from "../services/MessageService"
import { registerConnectionHandlers } from "./connectionHandlers"
import { registerQueueHandlers } from "./queueHandlers"
import { registerMessageHandlers } from "./messageHandlers"

export function registerAllHandlers(
  connectionService: ConnectionService,
  queueService: QueueService,
  messageService: MessageService
): void {
  registerConnectionHandlers(connectionService)
  registerQueueHandlers(queueService)
  registerMessageHandlers(messageService)
}
