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
import { useAppStore } from "@/stores/useAppStore"
import { useConnectionStore } from "@/stores/useConnectionStore"
import { toast } from "sonner"
import sqsIcon from "@/icons/SQS.svg"
import rabbitIcon from "@/icons/RABBIT.svg"

type ProviderType = "sqs" | "rabbitmq"

type ProviderField = {
  key: string
  label: string
  placeholder: string
  required: boolean
  type?: "text" | "password"
}

const providerFields: Record<string, ProviderField[]> = {
  sqs: [
    { key: "region", label: "Region", placeholder: "us-east-1", required: true },
    { key: "accessKeyId", label: "Access Key ID", placeholder: "AKIA...", required: true },
    { key: "secretAccessKey", label: "Secret Access Key", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, type: "password" },
  ],
  rabbitmq: [
    { key: "url", label: "AMQP URL", placeholder: "amqp://guest:guest@localhost:5672", required: true },
    { key: "managementUrl", label: "Management URL", placeholder: "http://guest:guest@localhost:15672", required: true },
    { key: "managementUser", label: "Management User", placeholder: "guest", required: false },
    { key: "managementPassword", label: "Management Password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: false, type: "password" },
  ],
}

const providerNames: Record<string, string> = {
  sqs: "AWS SQS",
  rabbitmq: "RabbitMQ",
}

const providerDescriptions: Record<string, string> = {
  sqs: "Amazon Simple Queue Service",
  rabbitmq: "RabbitMQ message broker",
}

const availableProviders: ProviderType[] = ["sqs", "rabbitmq"]

const providerIconSrc: Record<string, string> = {
  sqs: sqsIcon,
  rabbitmq: rabbitIcon,
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

  const [step, setStep] = useState<"select" | "config">(
    editingConnection ? "config" : "select"
  )
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(
    editingConnection ? (editingConnection.provider as ProviderType) : null
  )
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editingConnection) return
    setName(editingConnection.name)
    setSelectedProvider(editingConnection.provider as ProviderType)
    setStep("config")
    const values: Record<string, string> = {}
    for (const [key, value] of Object.entries(editingConnection.config)) {
      values[key] = String(value ?? "")
    }
    setFormValues(values)
  }, [editingConnectionId])

  function handleClose() {
    if (isEditing) {
      closeEditModal()
    } else {
      closeModal()
    }
  }

  function handleSelectProvider(provider: ProviderType) {
    if (isEditing) return
    setSelectedProvider(provider)
    setFormValues({})
    setName(providerNames[provider])
    setError(null)
    setStep("config")
  }

  function handleFieldChange(key: string, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleBack() {
    if (isEditing) return
    setStep("select")
    setSelectedProvider(null)
    setError(null)
  }

  async function handleSubmit() {
    if (!selectedProvider) return

    const fields = providerFields[selectedProvider]
    for (const field of fields) {
      if (field.required && !formValues[field.key]) {
        setError(`${field.label} is required`)
        return
      }
    }

    try {
      const config: Record<string, unknown> = {}
      for (const field of fields) {
        config[field.key] = formValues[field.key]
      }

      if (isEditing && editingConnectionId) {
        const result = await updateConnection(editingConnectionId, name || providerNames[selectedProvider], selectedProvider, config)
        setCurrentConnection(result)
        closeEditModal()
        toast.success("Connection updated")
      } else {
        await connect(name || providerNames[selectedProvider], selectedProvider, config)
        closeModal()
        toast.success("Connection created")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save connection"
      setError(message)
      toast.error(message)
    }
  }

  const fields = selectedProvider ? providerFields[selectedProvider] : []

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? `Edit ${providerNames[selectedProvider ?? ""] || "Connection"}`
              : step === "select"
                ? "New Connection"
                : `Configure ${providerNames[selectedProvider!]}`}
          </DialogTitle>
        </DialogHeader>

        {step === "select" && !isEditing && (
          <div className="flex flex-col gap-2">
            {availableProviders.map((provider) => (
              <button
                key={provider}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent hover:border-primary transition-colors text-left w-full"
                onClick={() => handleSelectProvider(provider)}
              >
                <img src={providerIconSrc[provider]} alt="" className="w-8 h-8" />
                <div>
                  <div className="font-medium text-sm">{providerNames[provider]}</div>
                  <div className="text-xs text-muted-foreground">{providerDescriptions[provider]}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === "config" && selectedProvider && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Connection Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Connection"
              />
            </div>

            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </label>
                <Input
                  type={field.type ?? "text"}
                  value={formValues[field.key] ?? ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              </div>
            ))}

            {error && (
              <div className="text-xs text-destructive mt-1">{error}</div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "config" && !isEditing && (
            <Button variant="ghost" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === "config" && (
            <Button onClick={handleSubmit} loading={isLoading} disabled={isLoading}>
              {isEditing ? "Save" : "Connect"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { NewConnectionModal }