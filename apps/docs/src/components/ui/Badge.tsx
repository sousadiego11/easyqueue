import type { HTMLAttributes, ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3.5 py-1 text-xs font-semibold border transition-all duration-200",
  {
    variants: {
      variant: {
        supported:
          "bg-green/10 text-green border-green/30 hover:bg-green/15 hover:border-green/40",
        planned:
          "bg-gray-badge/10 text-gray-badge border-gray-badge-border hover:bg-gray-badge/15 hover:border-gray-badge/40",
        version:
          "bg-primary/15 text-accent border-primary/30 hover:bg-primary/20 hover:border-primary/40",
      },
    },
    defaultVariants: {
      variant: "supported",
    },
  },
)

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  children: ReactNode
}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props}>
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
export type { BadgeProps }
