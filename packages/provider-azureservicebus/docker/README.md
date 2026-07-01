# Azure Service Bus Emulator

```bash
pnpm docker:up      # start
pnpm docker:down    # stop
```

Requires ~30s for SQL Server + emulator to be healthy.

## Config values for the connection modal

| Field | Value |
|---|---|
| Connection String | `Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=EasyQueue@2024!;UseDevelopmentEmulator=true` |

## Predefined queues

The emulator starts with three queues: `orders`, `payments`, `notifications`.
