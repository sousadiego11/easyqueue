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
      <Card className="p-9 text-center transition-all duration-300 group hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_12px_40px_rgba(109,74,255,0.1)]">
        <div className="mb-4 flex justify-center text-text-secondary transition-all duration-300 group-hover:text-accent group-hover:scale-105">
          {icon}
        </div>
        <h3 className="mb-5 text-xl font-semibold">{name}</h3>
        <div className="flex flex-col gap-2.5">
          {formats.map((fmt) => (
            <a
              key={`${fmt.ext}-${fmt.label}`}
              href={GITHUB_RELEASES}
              target="_blank"
              rel="noopener noreferrer"
              className="group/link flex items-center justify-center gap-2 rounded-lg border border-surface-border bg-surface-hover px-5 py-3 text-sm font-medium text-text transition-all duration-200 hover:border-primary/50 hover:bg-primary/15 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="font-mono text-xs font-semibold text-accent">
                {fmt.ext}
              </span>
              {fmt.label}
              <ExternalLink className="ml-1 h-3.5 w-3.5 text-text-muted transition-all duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
            </a>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}
