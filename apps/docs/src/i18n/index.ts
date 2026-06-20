import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./en"
import ptBR from "./pt-BR"

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "pt-BR": { translation: ptBR },
  },
  lng: "pt-BR",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

export default i18n
