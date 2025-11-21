'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlowInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const GlowInput = React.forwardRef<HTMLInputElement, GlowInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border-2 border-electric-cyan/30 bg-muted/50 px-4 py-3 text-sm",
          "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "focus-visible:border-electric-cyan focus-visible:glow-border",
          "transition-all duration-300",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
GlowInput.displayName = "GlowInput"

export { GlowInput }

