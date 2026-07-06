import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import { useAppStore } from "@/stores/useAppStore"
import { useConnectionStore } from "@/stores/useConnectionStore"
import { toast } from "sonner"
import sqsIcon from "@/icons/SQS.svg"
import rabbitIcon from "@/icons/RABBIT.svg"
import redisIcon from "@/icons/REDIS.svg"
import azureIcon from "@/icons/AZURE.svg"
import natsIcon from "@/icons/NATS.svg"
import type { Provider } from "@easyqueue/core"
import type { ProviderField } from "./types"

const providerFields: Record<Provider, ProviderField[]> = {
  sqs: [
    { key: "region", label: "Region", placeholder: "us-east-1", required: true },
    { key: "accessKeyId", label: "Access Key ID", placeholder: "AKIA...", required: true },
    { key: "secretAccessKey", label: "Secret Access Key", placeholder: "••••••••", required: true, type: "password" },
    { key: "endpoint", label: "Endpoint", placeholder: "http://localhost:4566", required: false, info: "Leave empty to use AWS. Use your LocalStack endpoint if using LocalStack." },
  ],
  rabbitmq: [
    { key: "url", label: "AMQP URL", placeholder: "amqp://guest:guest@localhost:5672", required: true },
    { key: "managementUrl", label: "Management URL", placeholder: "http://localhost:15672", required: true, info: "Required so EasyQueue can list queues via the RabbitMQ Management HTTP API." },
    { key: "managementUser", label: "Management User", placeholder: "guest", required: true },
    { key: "managementPassword", label: "Management Password", placeholder: "••••••••", required: true, type: "password" },
  ],
  redis: [
    { key: "url", label: "URL", placeholder: "redis://localhost:6379", required: true },
  ],
  azureservicebus: [
    { key: "connectionString", label: "Connection String", placeholder: "Endpoint=sb://...", required: true, info: "Must have Manage permission on the namespace to list queues via the management API." },
  ],
  natsjetstream: [
    { key: "servers", label: "Servers", placeholder: "nats://localhost:4222", required: true },
    { key: "user", label: "User", placeholder: "(optional)", required: false },
    { key: "password", label: "Password", placeholder: "(optional)", required: false, type: "password" },
  ],
}

const providerMeta: Record<Provider, { name: string; description: string; icon: string }> = {
  sqs: { name: "AWS SQS", description: "Amazon Simple Queue Service", icon: sqsIcon },
  rabbitmq: { name: "RabbitMQ", description: "RabbitMQ message broker", icon: rabbitIcon },
  redis: { name: "Redis Streams", description: "Redis Streams", icon: redisIcon },
  azureservicebus: { name: "Azure Service Bus", description: "Azure Service Bus", icon: azureIcon },
  natsjetstream: { name: "NATS JetStream", description: "NATS JetStream", icon: natsIcon },
}

const availableProviders: Provider[] = ["sqs", "rabbitmq", "redis", "azureservicebus", "natsjetstream"]

function ProviderList({ onSelect }: { onSelect: (p: Provider) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {availableProviders.map((provider) => {
        const { name, description, icon } = providerMeta[provider]
        return (
          <button
            key={provider}
            className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent hover:border-primary transition-colors text-left w-full"
            onClick={() => onSelect(provider)}
          >
            <img src={icon} alt="" className="w-8 h-8" />
            <div>
              <div className="font-medium text-sm">{name}</div>
              <div className="text-xs text-muted-foreground">{description}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ProviderForm({
  provider,
  name,
  onNameChange,
  values,
  onFieldChange,
  error,
}: {
  provider: Provider
  name: string
  onNameChange: (v: string) => void
  values: Record<string, string>
  onFieldChange: (key: string, value: string) => void
  error: string | null
}) {
  const fields = providerFields[provider]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Connection Name</label>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="My Connection"
        />
      </div>

      {fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <label className="text-sm font-medium inline-flex items-center gap-1">
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
            {field.info && (
              <span title={field.info}>
                <Info className="size-3.5 text-muted-foreground cursor-help" />
              </span>
            )}
          </label>
          <Input
            type={field.type ?? "text"}
            value={values[field.key] ?? ""}
            onChange={(e) => onFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      ))}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function NewConnectionModal() {
  const closeModal = useAppStore((s) => s.closeNewConnectionModal)
  const closeEditModal = useAppStore((s) => s.closeEditConnectionModal)
  const editingConnectionId = useAppStore((s) => s.editingConnectionId)
  const connections = useConnectionStore((s) => s.connections)
  const connect = useConnectionStore((s) => s.connect)
  const updateConnection = useConnectionStore((s) => s.updateConnection)
  const isLoading = useConnectionStore((s) => s.isLoading)
  const setCurrentConnection = useAppStore((s) => s.setCurrentConnection)

  const isEditing = editingConnectionId !== null
  const editingConnection = isEditing ? connections.find((c) => c.id === editingConnectionId) : null

  const [step, setStep] = useState<"select" | "config">(editingConnection ? "config" : "select")
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    editingConnection ? (editingConnection.provider as Provider) : null
  )
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editingConnection) return
    setName(editingConnection.name)
    setSelectedProvider(editingConnection.provider as Provider)
    setStep("config")
    const values: Record<string, string> = {}
    for (const [key, value] of Object.entries(editingConnection.config)) {
      values[key] = String(value ?? "")
    }
    setFormValues(values)
  }, [editingConnectionId])

  function handleClose() {
    useConnectionStore.getState().resetStatus()
    isEditing ? closeEditModal() : closeModal()
  }

  function handleSelectProvider(provider: Provider) {
    setSelectedProvider(provider)
    setFormValues({})
    setName(providerMeta[provider].name)
    setError(null)
    setStep("config")
  }

  function handleBack() {
    setStep("select")
    setSelectedProvider(null)
    setError(null)
  }

  async function handleSubmit() {
    if (!selectedProvider) return

    const fields = providerFields[selectedProvider]
    const missing = fields.find((f) => f.required && !formValues[f.key])
    if (missing) {
      setError(`${missing.label} is required`)
      return
    }

    const config: Record<string, unknown> = Object.fromEntries(
      fields.map((f) => [f.key, formValues[f.key]])
    )

    try {
      if (isEditing && editingConnectionId) {
        const result = await updateConnection(editingConnectionId, name || providerMeta[selectedProvider].name, selectedProvider, config)
        setCurrentConnection(result)
        closeEditModal()
        toast.success("Connection updated")
      } else {
        await connect(name || providerMeta[selectedProvider].name, selectedProvider, config)
        closeModal()
        toast.success("Connection created")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save connection"
      setError(message)
      toast.error(message)
    }
  }

  const title = isEditing
    ? `Edit ${selectedProvider ? providerMeta[selectedProvider].name : "Connection"}`
    : step === "select"
      ? "New Connection"
      : `Configure ${selectedProvider ? providerMeta[selectedProvider].name : ""}`

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {step === "select" && !isEditing && (
          <ProviderList onSelect={handleSelectProvider} />
        )}

        {step === "config" && selectedProvider && (
          <ProviderForm
            provider={selectedProvider}
            name={name}
            onNameChange={setName}
            values={formValues}
            onFieldChange={(key, value) => setFormValues((prev) => ({ ...prev, [key]: value }))}
            error={error}
          />
        )}

        <DialogFooter>
          {step === "config" && !isEditing && (
            <Button variant="ghost" onClick={handleBack}>Back</Button>
          )}
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          {step === "config" && (
            <Button onClick={handleSubmit} loading={isLoading}>
              {isEditing ? "Save" : "Connect"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { NewConnectionModal }