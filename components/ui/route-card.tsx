'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Train, ArrowRight } from "lucide-react"
import { FuturisticCard } from "./futuristic-card"

interface RouteCardProps extends React.HTMLAttributes<HTMLDivElement> {
  from: string
  to: string
  price?: string
  duration?: string
  onClick?: () => void
}

const RouteCard = React.forwardRef<HTMLDivElement, RouteCardProps>(
  ({ className, from, to, price, duration, onClick, ...props }, ref) => {
    return (
      <FuturisticCard
        ref={ref}
        className={cn(
          "cursor-pointer group",
          onClick && "hover:border-electric-cyan hover:glow-border",
          className
        )}
        onClick={onClick}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">From</p>
                <p className="text-lg font-semibold text-foreground">{from}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-electric-cyan" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">To</p>
                <p className="text-lg font-semibold text-foreground">{to}</p>
              </div>
            </div>
            {(price || duration) && (
              <div className="flex items-center gap-4 pt-2">
                {duration && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Train className="h-4 w-4" />
                    <span>{duration}</span>
                  </div>
                )}
                {price && (
                  <div className="text-lg font-bold text-electric-cyan">
                    {price}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </FuturisticCard>
    )
  }
)
RouteCard.displayName = "RouteCard"

export { RouteCard }

