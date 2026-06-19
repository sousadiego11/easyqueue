import { cn } from "@/lib/utils"

function StatusDot({ active, className }: { active: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "w-2 h-2 rounded-full flex-shrink-0",
        active ? "bg-[#22c55e]" : "bg-[#f87171]",
        className,
      )}
    />
  )
}

export { StatusDot }
