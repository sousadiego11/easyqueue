import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 rounded-xl font-semibold transition-all duration-200 cursor-pointer select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-linear-to-r from-primary to-[#5B21B6] text-white shadow-[0_4px_20px_rgba(109,74,255,0.3)] hover:shadow-[0_8px_32px_rgba(109,74,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_10px_rgba(109,74,255,0.2)] focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0",
        secondary:
          "border border-surface-border text-white bg-transparent hover:bg-surface hover:border-text-muted active:bg-surface-hover focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none",
        ghost:
          "text-text-secondary hover:text-white bg-transparent hover:bg-white/5 active:bg-white/10 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none",
      },
      size: {
        default: "px-7 py-3.5 text-base",
        sm: "px-4 py-2 text-sm",
        icon: "p-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  children: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
export type { ButtonProps }
