import { useState } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { ZoomIn } from "lucide-react"
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
  { src: "/assets/conn.png", labelKey: "connection" }
]

export function PreviewGallery() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const slides: Slide[] = [
    { src: "/assets/dark.png", title: t("preview.labels.dark") },
    { src: "/assets/light.png", title: t("preview.labels.light") },
    { src: "/assets/conn.png", title: t("preview.labels.connection") },
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

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          {images.map((img, i) => (
            <motion.div
              key={img.labelKey}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-surface-border bg-surface transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(109,74,255,0.12)] hover:border-primary/40"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              onClick={() => { setIndex(i); setOpen(true) }}
            >
              <div className="relative bg-bg-primary p-1 overflow-hidden">
                <img
                  src={img.src}
                  alt={t(`preview.labels.${img.labelKey}`)}
                  className="w-full rounded-lg transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  loading="lazy"
                  width={800}
                  height={500}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="rounded-full bg-primary/20 backdrop-blur-sm p-2.5 border border-white/10">
                    <ZoomIn className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
              <p className="px-5 py-4 text-[13px] font-medium text-text-secondary">
                {t(`preview.labels.${img.labelKey}`)}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mx-auto max-w-[800px] cursor-pointer rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(109,74,255,0.12)] group"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          onClick={() => { setIndex(2); setOpen(true) }}
        >
          <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface transition-all duration-300 group-hover:border-primary/40">
            <div className="relative bg-bg-primary p-1 overflow-hidden">
              <video
                src="/assets/preview.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full rounded-lg transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="rounded-full bg-primary/20 backdrop-blur-sm p-2.5 border border-white/10">
                  <ZoomIn className="h-5 w-5 text-white" />
                </div>
              </div>
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
