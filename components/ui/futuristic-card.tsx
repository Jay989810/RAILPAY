'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

interface FuturisticCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean
  hover?: boolean
}

const FuturisticCard = React.forwardRef<HTMLDivElement, FuturisticCardProps>(
  ({ className, glow = false, hover = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border border-electric-cyan/20 bg-card/80 backdrop-blur-sm p-6",
          "shadow-lg transition-all duration-300",
          glow && "glow-border",
          hover && "hover:border-electric-cyan/50 hover:shadow-xl hover:scale-[1.02]",
          className
        )}
        {...props}
      />
    )
  }
)
FuturisticCard.displayName = "FuturisticCard"

export { FuturisticCard }

