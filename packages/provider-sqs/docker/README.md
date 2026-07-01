# SQS Emulator (LocalStack)

```bash
pnpm docker:up      # start
pnpm docker:down    # stop
```

## Config values for the connection modal

| Field | Value |
|---|---|
| Region | `us-east-1` (any valid region) |
| Access Key ID | `test` (LocalStack accepts any value) |
| Secret Access Key | `test` (LocalStack accepts any value) |
| Endpoint | `http://localhost:4566` |

## Predefined queues

The emulator starts with three queues: `orders`, `payments`, `notifications`.
