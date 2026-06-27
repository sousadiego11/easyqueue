import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Download, Github, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useGitHubRelease } from "@/hooks/useGitHubRelease"

const GITHUB_RELEASES = "https://github.com/sousadiego11/easyqueue/releases"
const GITHUB_REPO = "https://github.com/sousadiego11/easyqueue"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] as const, delay },
})

export function Hero() {
  const { t } = useTranslation()
  const { version } = useGitHubRelease()

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-30 pb-20"
      aria-label="Hero"
    >
      <div
        className="pointer-events-none absolute top-[-30%] left-1/2 -translate-x-1/2 h-[800px] w-[800px] rounded-full animate-glow-pulse"
        style={{
          background: "radial-gradient(circle, rgba(109,74,255,0.2) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute top-[-10%] left-[-10%] h-[400px] w-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(109,74,255,0.08) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <motion.div className="relative max-w-[720px] text-center">
        <motion.div {...fadeUp(0)}>
          <a
            href={GITHUB_RELEASES}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-4 py-1.5 text-sm font-semibold text-accent transition-all duration-300 hover:bg-primary/25 hover:border-primary/50 hover:shadow-[0_0_24px_rgba(109,74,255,0.2)]"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-green animate-pulse" />
            <span>v{version}</span>
            <span className="font-normal text-text-muted">{t("hero.version")}</span>
          </a>
        </motion.div>

        <motion.div {...fadeUp(0.1)}>
          <img
            src="/assets/logo.svg"
            alt=""
            className="mx-auto mb-6 h-20 w-20 rounded-[18px] shadow-[0_8px_32px_rgba(109,74,255,0.3)]"
          />
        </motion.div>

        <motion.h1
          className="text-[clamp(40px,8vw,80px)] font-black leading-[1.1] tracking-tight mb-2 text-balance"
          {...fadeUp(0.15)}
        >
          {t("hero.title")}
        </motion.h1>

        <motion.p
          className="text-[clamp(18px,3vw,28px)] font-semibold text-accent mb-5 text-balance"
          {...fadeUp(0.2)}
        >
          {t("hero.tagline")}
        </motion.p>

        <motion.p
          className="mb-10 text-lg leading-relaxed text-text-secondary mx-auto max-w-[600px] text-balance"
          {...fadeUp(0.25)}
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-4"
          {...fadeUp(0.3)}
        >
          <a href={GITHUB_RELEASES} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="default" asChild>
              <span>
                <Download className="h-5 w-5" />
                {t("hero.cta.download")}
              </span>
            </Button>
          </a>
          <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="default" asChild>
              <span>
                <Github className="h-5 w-5" />
                {t("hero.cta.github")}
              </span>
            </Button>
          </a>
        </motion.div>

        <motion.div
          className="mt-16 text-text-muted"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          aria-hidden="true"
        >
          <ChevronDown className="mx-auto h-6 w-6 opacity-50" />
        </motion.div>
      </motion.div>
    </section>
  )
}
