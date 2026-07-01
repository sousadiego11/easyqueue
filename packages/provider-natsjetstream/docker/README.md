# NATS JetStream

```bash
pnpm docker:up      # start
pnpm docker:down    # stop
```

## Config values for the connection modal

| Field | Value |
|---|---|
| Servers | `nats://localhost:4222` |
| User | *(leave empty — no auth)* |
| Password | *(leave empty — no auth)* |

## Predefined streams

The container starts with three streams: `orders`, `payments`, `notifications`.
