import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Navbar } from "@/components/Navbar"
import { Hero } from "@/components/Hero"
import { WhySection } from "@/components/WhySection"
import { PreviewGallery } from "@/components/PreviewGallery"
import { Features } from "@/components/Features"
import { Brokers } from "@/components/Brokers"
import { PrivacySection } from "@/components/PrivacySection"
import { Download } from "@/components/Download"
import { StarSection } from "@/components/StarSection"
import { Footer } from "@/components/Footer"

function useDynamicMeta() {
  const { i18n, t } = useTranslation()

  useEffect(() => {
    const html = document.documentElement
    const currentLang = i18n.language
    html.lang = currentLang

    const ogLocale = document.querySelector('meta[property="og:locale"]')
    if (ogLocale) {
      ogLocale.setAttribute("content", currentLang === "pt-BR" ? "pt_BR" : "en_US")
    }

    const title = `EasyQueue — ${t("hero.tagline")}`
    document.title = title

    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute("content", title)

    const metaDesc = document.querySelector('meta[name="description"]')
    const ogDesc = document.querySelector('meta[property="og:description"]')
    const twitterDesc = document.querySelector('meta[name="twitter:description"]')
    if (metaDesc) metaDesc.setAttribute("content", t("hero.subtitle"))
    if (ogDesc) ogDesc.setAttribute("content", t("hero.subtitle"))
    if (twitterDesc) twitterDesc.setAttribute("content", t("hero.subtitle"))
  }, [i18n.language, t])
}

export default function App() {
  useDynamicMeta()

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <WhySection />
        <PreviewGallery />
        <Features />
        <Brokers />
        <PrivacySection />
        <Download />
        <StarSection />
      </main>
      <Footer />
    </>
  )
}
