import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/Button"

const languages = [
  { code: "pt-BR", label: "PT" },
  { code: "en", label: "EN" },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div className="flex items-center gap-1.5">
      <Globe className="h-4 w-4 text-text-secondary" aria-hidden="true" />
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant="ghost"
          size="sm"
          onClick={() => i18n.changeLanguage(lang.code)}
          className={
            i18n.language === lang.code
              ? "text-text font-semibold"
              : "text-text-muted"
          }
          aria-label={`Switch to ${lang.label}`}
        >
          {lang.label}
        </Button>
      ))}
    </div>
  )
}
