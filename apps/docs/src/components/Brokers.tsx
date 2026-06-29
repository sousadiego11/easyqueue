import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import { CircleDot, Globe, Database, Layers, Server } from "lucide-react"

const icons = [CircleDot, Globe, Database, Layers, Server]

function BrokerBadge({ supported, label }: { supported: boolean; label: string }) {
  return (
    <Badge variant={supported ? "supported" : "planned"}>{label}</Badge>
  )
}

export function Brokers() {
  const { t } = useTranslation()

  const items = t("brokers.items", { returnObjects: true }) as {
    name: string
    desc: string
  }[]

  const supportedMap: Record<string, boolean> = {
    RabbitMQ: true,
    "AWS SQS": true,
    "Azure Service Bus": false,
    "Google Pub/Sub": false,
    Redis: true,
  }

  return (
    <section id="brokers" className="py-24 px-6 bg-bg-alt" aria-label="Brokers suportados">
      <div className="mx-auto max-w-[1100px]">
        <motion.h2
          className="text-gradient text-center text-[clamp(28px,4vw,40px)] font-extrabold mb-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t("brokers.title")}
        </motion.h2>
        <motion.p
          className="mx-auto mb-14 max-w-[640px] text-center text-lg text-text-secondary"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {t("brokers.subtitle")}
        </motion.p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const Icon = icons[i] || Globe
            const supported = supportedMap[item.name] ?? false
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Card
                  className={`p-8 text-center transition-all duration-300 group cursor-default ${
                    supported
                      ? "hover:-translate-y-1 hover:border-green/50 hover:shadow-[0_12px_40px_rgba(34,197,94,0.08)]"
                      : "hover:-translate-y-1 hover:border-gray-badge/50 hover:shadow-[0_8px_32px_rgba(156,163,175,0.06)]"
                  }`}
                >
                  <div className="mb-4 flex justify-center text-accent transition-all duration-300 group-hover:scale-105">
                    <Icon className="h-12 w-12" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2.5 text-xl font-semibold">{item.name}</h3>
                  <p className="mb-5 text-sm leading-relaxed text-text-secondary">
                    {item.desc}
                  </p>
                  <BrokerBadge
                    supported={supported}
                    label={
                      supported
                        ? t("brokers.badge.supported")
                        : t("brokers.badge.planned")
                    }
                  />
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
