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
      className="rounded-xl border border-surface-border bg-surface p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-xl bg-primary/10 text-accent">
        {icon}
      </div>
      <h3 className="mb-2.5 text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-text-secondary">{desc}</p>
    </motion.div>
  )
}
