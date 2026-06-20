import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Monitor, Apple, Terminal } from "lucide-react"
import { DownloadCard } from "./DownloadCard"

const platformIcons = [Monitor, Apple, Terminal]

export function Download() {
  const { t } = useTranslation()

  const platforms = [
    t("download.platforms.windows", { returnObjects: true }) as {
      name: string
      formats: { ext: string; label: string }[]
    },
    t("download.platforms.macos", { returnObjects: true }) as {
      name: string
      formats: { ext: string; label: string }[]
    },
    t("download.platforms.linux", { returnObjects: true }) as {
      name: string
      formats: { ext: string; label: string }[]
    },
  ]

  return (
    <section id="download" className="py-24 px-6 bg-bg-alt" aria-label="Download">
      <div className="mx-auto max-w-[1100px]">
        <motion.h2
          className="text-gradient text-center text-[clamp(28px,4vw,40px)] font-extrabold mb-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t("download.title")}
        </motion.h2>
        <motion.p
          className="mx-auto mb-14 max-w-[640px] text-center text-lg text-text-secondary"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {t("download.subtitle")}
        </motion.p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform, i) => {
            const Icon = platformIcons[i] || Monitor
            return (
              <DownloadCard
                key={platform.name}
                icon={<Icon className="h-10 w-10" strokeWidth={1.5} />}
                name={platform.name}
                formats={platform.formats}
                index={i}
              />
            )
          })}
        </div>

        <motion.p
          className="mt-8 text-center text-sm text-text-muted"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {t("download.note")}{" "}
          <a
            href="https://github.com/sousadiego11/easyqueue/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:text-text transition-colors"
          >
            {t("download.noteLink")}
          </a>
        </motion.p>
      </div>
    </section>
  )
}
