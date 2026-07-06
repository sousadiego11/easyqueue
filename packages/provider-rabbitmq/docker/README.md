# RabbitMQ

```bash
pnpm docker:up      # start
pnpm docker:down    # stop
```

## Config values for the connection modal

| Field | Value |
|---|---|
| AMQP URL | `amqp://guest:guest@localhost:5672` |
| Management URL | `http://localhost:15672` |
| Management User | `guest` |
| Management Password | `guest` |

Management UI available at http://localhost:15672 (guest/guest).

## Predefined queues

The container starts with three queues: `orders`, `payments`, `notifications`.
