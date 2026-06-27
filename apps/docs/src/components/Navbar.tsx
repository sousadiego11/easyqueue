import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"
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

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  const handleNavClick = () => setMobileOpen(false)

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
        scrolled
          ? "glass border-b border-surface-border shadow-sm"
          : "bg-transparent"
      }`}
      role="navigation"
      aria-label={t("nav.aria")}
    >
      <div className="mx-auto flex h-full max-w-[1100px] items-center gap-8 px-6">
        <a href="#hero" className="flex items-center gap-2.5 text-text font-bold text-lg shrink-0">
          <img src="/assets/logo.svg" alt="EasyQueue" width={32} height={32} className="rounded-lg shrink-0" />
          <span className="hidden xs:inline">EasyQueue</span>
        </a>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={handleNavClick}
              className="relative text-text-secondary hover:text-text text-sm font-medium transition-colors duration-200 after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {t(`nav.${link.key}`)}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <a
            href="https://github.com/sousadiego11/easyqueue"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text hover:border-text-muted hover:bg-surface/50 transition-all duration-200"
            aria-label={t("nav.star")}
          >
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="hidden sm:inline">{t("nav.star")}</span>
            {stars !== null && (
              <span className="text-text-muted text-xs">({stars.toLocaleString()})</span>
            )}
          </a>
          <button
            className="md:hidden text-text p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t("nav.menuClose") : t("nav.menuOpen")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-bg-primary border-b border-surface-border"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={handleNavClick}
                  className="py-2.5 text-text-secondary hover:text-text text-sm font-medium transition-colors rounded-lg hover:bg-white/5 px-3"
                >
                  {t(`nav.${link.key}`)}
                </a>
              ))}
              <div className="pt-2 px-3">
                <LanguageSwitcher />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
