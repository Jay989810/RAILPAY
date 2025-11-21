'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

interface NeonDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'cyan' | 'mint' | 'default'
}

const NeonDivider = React.forwardRef<HTMLDivElement, NeonDividerProps>(
  ({ className, variant = 'cyan', ...props }, ref) => {
    const variantClasses = {
      cyan: "border-electric-cyan/50 shadow-[0_0_10px_rgba(0,229,255,0.3)]",
      mint: "border-neon-mint/50 shadow-[0_0_10px_rgba(140,255,218,0.3)]",
      default: "border-border",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "w-full border-t",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
NeonDivider.displayName = "NeonDivider"

export { NeonDivider }

