import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { ArrowRight, X, Check } from "lucide-react"

export function WhySection() {
  const { t } = useTranslation()

  return (
    <section id="why" className="py-24 px-6" aria-label="Por que EasyQueue">
      <div className="mx-auto max-w-[1100px]">
        <motion.div
          className="grid gap-10 md:grid-cols-[1fr_auto_1fr] items-start"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            className="rounded-2xl border border-red/20 bg-red/5 p-10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(239,68,68,0.08)]"
            whileHover={{ scale: 1.005 }}
          >
            <h2 className="text-[22px] font-bold mb-5">{t("why.problem.title")}</h2>
            <p className="mb-4 text-text-secondary">{t("why.problem.desc")}</p>
            <ul className="mb-5 flex flex-col gap-2.5">
              {(t("why.problem.items", { returnObjects: true }) as string[]).map(
                (item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] text-text-secondary">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red" aria-hidden="true" />
                    {item}
                  </li>
                ),
              )}
            </ul>
            <p className="font-semibold text-text">{t("why.problem.conclusion")}</p>
          </motion.div>

          <motion.div
            className="hidden md:flex items-center justify-center pt-10"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <ArrowRight className="h-12 w-12 text-primary" />
            </motion.div>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-green/20 bg-green/5 p-10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(34,197,94,0.08)]"
            whileHover={{ scale: 1.005 }}
          >
            <h2 className="text-[22px] font-bold mb-5">{t("why.solution.title")}</h2>
            <p className="mb-4 text-text-secondary">{t("why.solution.desc")}</p>
            <ul className="mb-5 flex flex-col gap-2.5">
              {(t("why.solution.items", { returnObjects: true }) as string[]).map(
                (item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] text-text-secondary">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green" aria-hidden="true" />
                    {item}
                  </li>
                ),
              )}
            </ul>
            <p className="font-semibold text-text">{t("why.solution.conclusion")}</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
