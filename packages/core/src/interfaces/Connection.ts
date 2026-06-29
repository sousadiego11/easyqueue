export interface SQSConfig extends Record<string, unknown> {
  region: string
  accessKeyId: string
  secretAccessKey: string
}

export interface RabbitMQConfig extends Record<string, unknown> {
  url: string
  managementUrl: string
  managementUser: string
  managementPassword: string
}

export interface RedisConfig extends Record<string, unknown> {
  url: string
}

export interface ProviderConfigs {
  sqs: SQSConfig
  rabbitmq: RabbitMQConfig
  redis: RedisConfig
}

export type Provider = keyof ProviderConfigs

export interface Connection<TProvider extends Provider = Provider> {
  id: string
  name: string
  provider: TProvider
  config: ProviderConfigs[TProvider]
}
