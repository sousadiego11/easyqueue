import type { ReactNode } from "react"
import { motion } from "framer-motion"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  desc: string
  index: number
}

export function FeatureCard({ icon, title, desc, index }: FeatureCardProps) {
  return (
    <motion.div
      className="group rounded-xl border border-surface-border bg-surface p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_12px_40px_rgba(109,74,255,0.1)] cursor-default"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-xl bg-primary/10 text-accent transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-105">
        {icon}
      </div>
      <h3 className="mb-2.5 text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-text-secondary">{desc}</p>
    </motion.div>
  )
}
