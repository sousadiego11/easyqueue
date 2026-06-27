import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Star, Github } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useGitHubStars } from "@/hooks/useGitHubStars"

const GITHUB_REPO = "https://github.com/sousadiego11/easyqueue"

export function StarSection() {
  const { t } = useTranslation()
  const { stars } = useGitHubStars()

  return (
    <section className="py-24 px-6" aria-label="Star on GitHub">
      <div className="mx-auto max-w-[600px] text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="mb-6 flex justify-center"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            <Star className="h-16 w-16 fill-yellow-400 text-yellow-400" strokeWidth={1.5} />
          </motion.div>

          <h2 className="text-gradient text-[clamp(28px,4vw,40px)] font-extrabold mb-3">
            {t("star.title")}
          </h2>
          <p className="mb-8 text-lg text-text-secondary">
            {t("star.subtitle")}
          </p>

          <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="default" asChild>
              <span>
                <Github className="h-5 w-5" />
                {t("star.button")}
                {stars !== null && (
                  <span className="text-text/70 text-sm">
                    ({stars.toLocaleString()} {t("star.count")})
                  </span>
                )}
              </span>
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
