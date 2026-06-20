import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"

const images = [
  { src: "/assets/dark.png", labelKey: "dark" },
  { src: "/assets/light.png", labelKey: "light" },
]

export function PreviewGallery() {
  const { t } = useTranslation()

  return (
    <section id="preview" className="py-24 px-6 bg-bg-alt" aria-label="Preview">
      <div className="mx-auto max-w-[1100px]">
        <motion.h2
          className="text-gradient text-center text-[clamp(28px,4vw,40px)] font-extrabold mb-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t("preview.title")}
        </motion.h2>
        <motion.p
          className="mx-auto mb-14 max-w-[640px] text-center text-lg text-text-secondary"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {t("preview.subtitle")}
        </motion.p>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {images.map((img, i) => (
            <motion.div
              key={img.labelKey}
              className="overflow-hidden rounded-2xl border border-surface-border bg-surface"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div className="bg-bg-primary p-1">
                <img
                  src={img.src}
                  alt={t(`preview.labels.${img.labelKey}`)}
                  className="w-full rounded-lg"
                  loading="lazy"
                  width={800}
                  height={500}
                />
              </div>
              <p className="px-5 py-4 text-[13px] font-medium text-text-secondary">
                {t(`preview.labels.${img.labelKey}`)}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mx-auto max-w-[800px]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
            <div className="bg-bg-primary p-1">
              <img
                src="/assets/preview.gif"
                alt={t("preview.labels.animated")}
                className="w-full rounded-lg"
                loading="lazy"
                width={800}
                height={500}
              />
            </div>
            <p className="px-5 py-4 text-[13px] font-medium text-text-secondary">
              {t("preview.labels.animated")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
