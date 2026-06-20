import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-surface-border bg-surface transition-all duration-300",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Card }
export type { CardProps }
