import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Download, Github, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useGitHubRelease } from "@/hooks/useGitHubRelease"

const GITHUB_RELEASES = "https://github.com/sousadiego11/easyqueue/releases"
const GITHUB_REPO = "https://github.com/sousadiego11/easyqueue"

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
        className="pointer-events-none absolute top-[-30%] left-1/2 -translate-x-1/2 h-[800px] w-[800px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(109,74,255,0.2) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <motion.div
        className="relative max-w-[720px] text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <a
          href={GITHUB_RELEASES}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-4 py-1.5 text-sm font-semibold text-accent transition-colors hover:bg-primary/25"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-green" />
          v{version}
          <span className="font-normal text-text-muted">{t("hero.version")}</span>
        </a>

        <img
          src="/assets/logo.svg"
          alt=""
          className="mx-auto mb-6 h-20 w-20 rounded-[18px] drop-shadow-[0_8px_32px_rgba(109,74,255,0.3)]"
        />

        <h1 className="text-[clamp(48px,8vw,80px)] font-black leading-[1.1] tracking-tight mb-2">
          {t("hero.title")}
        </h1>

        <p className="text-[clamp(20px,3vw,28px)] font-semibold text-accent mb-5">
          {t("hero.tagline")}
        </p>

        <p className="mb-10 text-lg leading-relaxed text-text-secondary">
          {t("hero.subtitle")}
        </p>

        <div className="flex flex-wrap justify-center gap-4">
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
        </div>

        <motion.div
          className="mt-16 text-text-muted"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          aria-hidden="true"
        >
          <ChevronDown className="mx-auto h-6 w-6" />
        </motion.div>
      </motion.div>
    </section>
  )
}
