import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import {
  Send,
  Download,
  RefreshCw,
  Trash2,
  Code,
  Search,
  Moon,
  Server,
} from "lucide-react"
import { FeatureCard } from "./FeatureCard"

const icons = [Send, Download, RefreshCw, Trash2, Code, Search, Moon, Server]

export function Features() {
  const { t } = useTranslation()
  const items = t("features.items", { returnObjects: true }) as {
    title: string
    desc: string
  }[]

  return (
    <section id="features" className="py-24 px-6" aria-label="Funcionalidades">
      <div className="mx-auto max-w-[1100px]">
        <motion.h2
          className="text-gradient text-center text-[clamp(28px,4vw,40px)] font-extrabold mb-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t("features.title")}
        </motion.h2>
        <motion.p
          className="mx-auto mb-14 max-w-[640px] text-center text-lg text-text-secondary"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {t("features.subtitle")}
        </motion.p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const Icon = icons[i] || icons[0]
            return (
              <FeatureCard
                key={i}
                icon={<Icon className="h-7 w-7" />}
                title={item.title}
                desc={item.desc}
                index={i}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
