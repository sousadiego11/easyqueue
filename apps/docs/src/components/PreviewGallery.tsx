import { useState } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import Lightbox, { type Slide } from "yet-another-react-lightbox"
import Captions from "yet-another-react-lightbox/plugins/captions"
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen"
import Video from "yet-another-react-lightbox/plugins/video"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/captions.css"

const images = [
  { src: "/assets/dark.png", labelKey: "dark" },
  { src: "/assets/light.png", labelKey: "light" },
]

export function PreviewGallery() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const slides: Slide[] = [
    { src: "/assets/dark.png", title: t("preview.labels.dark") },
    { src: "/assets/light.png", title: t("preview.labels.light") },
    {
      type: "video",
      sources: [
        { src: "/assets/preview.mp4", type: "video/mp4" },
      ],
      title: t("preview.labels.animated"),
    },
  ]

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
              className="cursor-pointer overflow-hidden rounded-2xl border border-surface-border bg-surface transition hover:ring-2 hover:ring-primary/50"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              onClick={() => { setIndex(i); setOpen(true) }}
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
          className="mx-auto max-w-[800px] cursor-pointer transition hover:ring-2 hover:ring-primary/50 rounded-2xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          onClick={() => { setIndex(2); setOpen(true) }}
        >
          <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
            <div className="bg-bg-primary p-1">
              <video
                src="/assets/preview.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full rounded-lg"
              />
            </div>
            <p className="px-5 py-4 text-[13px] font-medium text-text-secondary">
              {t("preview.labels.animated")}
            </p>
          </div>
        </motion.div>
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
        plugins={[Captions, Fullscreen, Video, Zoom]}
        captions={{ descriptionTextAlign: "center" }}
      />
    </section>
  )
}
