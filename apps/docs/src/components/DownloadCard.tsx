import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/Card"

interface Format {
  ext: string
  label: string
}

interface DownloadCardProps {
  icon: ReactNode
  name: string
  formats: Format[]
  index: number
}

const GITHUB_RELEASES = "https://github.com/sousadiego11/easyqueue/releases"

export function DownloadCard({ icon, name, formats, index }: DownloadCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.12, duration: 0.4 }}
    >
      <Card className="p-9 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary">
        <div className="mb-4 flex justify-center text-text-secondary">{icon}</div>
        <h3 className="mb-5 text-xl font-semibold">{name}</h3>
        <div className="flex flex-col gap-2.5">
          {formats.map((fmt) => (
            <a
              key={`${fmt.ext}-${fmt.label}`}
              href={GITHUB_RELEASES}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-surface-border bg-surface-hover px-5 py-3 text-sm font-medium text-text transition-all hover:border-primary hover:bg-primary/15"
            >
              <span className="font-mono text-xs font-semibold text-accent">
                {fmt.ext}
              </span>
              {fmt.label}
              <ExternalLink className="ml-1 h-3.5 w-3.5 text-text-muted" />
            </a>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}
