import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Shield, Lock, WifiOff, Github } from "lucide-react"

const icons = [Shield, Lock, WifiOff, Github]

export function PrivacySection() {
  const { t } = useTranslation()
  const items = t("privacy.items", { returnObjects: true }) as {
    title: string
    desc: string
  }[]

  return (
    <section id="privacy" className="py-24 px-6" aria-label="Privacidade">
      <div className="mx-auto max-w-[1100px] text-center">
        <motion.div
          className="mb-5 flex justify-center text-primary"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <Shield className="h-16 w-16" strokeWidth={1.5} />
        </motion.div>

        <motion.h2
          className="text-gradient text-center text-[clamp(28px,4vw,40px)] font-extrabold mb-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t("privacy.title")}
        </motion.h2>
        <motion.p
          className="mx-auto mb-12 max-w-[640px] text-center text-lg text-text-secondary"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {t("privacy.subtitle")}
        </motion.p>

        <div className="grid gap-6 text-left sm:grid-cols-2">
          {items.map((item, i) => {
            const Icon = icons[i] || Shield
            return (
              <motion.div
                key={item.title}
                className="rounded-xl border border-surface-border bg-surface p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(109,74,255,0.06)]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Icon className="mb-3 h-6 w-6 text-accent transition-all duration-300 group-hover:scale-110" aria-hidden="true" />
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{item.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
