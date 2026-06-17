import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground",
        blue: "border-transparent bg-blue-100 text-blue-800 dark:bg-[#1e3a5f] dark:text-[#93c5fd]",
        green: "border-transparent bg-green-100 text-green-800 dark:bg-[#14532d] dark:text-[#86efac]",
        yellow: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-[#713f12] dark:text-[#fde047]",
        purple: "border-transparent bg-purple-100 text-purple-800 dark:bg-[#3b0764] dark:text-[#d8b4fe]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
