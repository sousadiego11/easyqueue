import { useTranslation } from "react-i18next"
import { Github, FileText, Users } from "lucide-react"

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer
      className="border-t border-surface-border py-12 px-6"
      role="contentinfo"
      aria-label={t("footer.aria")}
    >
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-8 flex flex-col items-center justify-between gap-5 md:flex-row">
          <div className="flex items-center gap-2.5 font-bold text-base">
            <img src="/assets/logo.svg" alt="" width={28} height={28} className="rounded-md shrink-0" />
            <span>EasyQueue</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <a
              href="https://github.com/sousadiego11/easyqueue"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"
            >
              <Github className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
              {t("footer.links.github")}
            </a>
            <a
              href="https://github.com/sousadiego11/easyqueue/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"
            >
              <FileText className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
              {t("footer.links.license")}
            </a>
            <a
              href="https://github.com/sousadiego11/easyqueue/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"
            >
              <Users className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
              {t("footer.links.contribute")}
            </a>
          </div>
        </div>

        <div className="text-center text-[13px] text-text-muted flex flex-col gap-1">
          <p>{t("footer.copyright")}</p>
          <p>{t("footer.madeWith")}</p>
        </div>
      </div>
    </footer>
  )
}
