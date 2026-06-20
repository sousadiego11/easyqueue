import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 rounded-xl font-semibold transition-all duration-200 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-linear-to-r from-primary to-[#5B21B6] text-white shadow-[0_4px_20px_rgba(109,74,255,0.3)] hover:shadow-[0_8px_32px_rgba(109,74,255,0.4)] hover:-translate-y-0.5",
        secondary:
          "border border-surface-border text-white bg-transparent hover:bg-surface hover:border-text-muted",
        ghost:
          "text-text-secondary hover:text-white bg-transparent",
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
