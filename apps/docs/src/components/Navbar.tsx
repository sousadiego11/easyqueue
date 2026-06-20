import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Menu, X, Star } from "lucide-react"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { useGitHubStars } from "@/hooks/useGitHubStars"

const navLinks = [
  { key: "features", href: "#features" },
  { key: "brokers", href: "#brokers" },
  { key: "privacy", href: "#privacy" },
  { key: "download", href: "#download" },
]

export function Navbar() {
  const { t } = useTranslation()
  const { stars } = useGitHubStars()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleNavClick = () => setMobileOpen(false)

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
        scrolled
          ? "glass border-b border-surface-border"
          : "bg-transparent"
      }`}
      role="navigation"
      aria-label={t("nav.aria")}
    >
      <div className="mx-auto flex h-full max-w-[1100px] items-center gap-8 px-6">
        <a href="#hero" className="flex items-center gap-2.5 text-text font-bold text-lg shrink-0">
          <img src="/assets/logo.svg" alt="EasyQueue" width={32} height={32} className="rounded-lg" />
          EasyQueue
        </a>

        <div
          className={`${
            mobileOpen ? "flex" : "hidden"
          } md:flex flex-col md:flex-row items-start md:items-center gap-6 absolute md:static top-16 left-0 right-0 md:bg-transparent bg-bg-primary border-b md:border-0 border-surface-border p-6 md:p-0`}
        >
          {navLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={handleNavClick}
              className="text-text-secondary hover:text-text text-sm font-medium transition-colors"
            >
              {t(`nav.${link.key}`)}
            </a>
          ))}
          <div className="md:hidden">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <a
            href="https://github.com/sousadiego11/easyqueue"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text hover:border-text-muted transition-all"
            aria-label={t("nav.star")}
          >
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{t("nav.star")}</span>
            {stars !== null && (
              <span className="text-text-muted text-xs">({stars.toLocaleString()})</span>
            )}
          </a>
          <button
            className="md:hidden text-text p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t("nav.menuClose") : t("nav.menuOpen")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
    </nav>
  )
}
