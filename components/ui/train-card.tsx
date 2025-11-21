'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Train, Clock, MapPin } from "lucide-react"
import { FuturisticCard } from "./futuristic-card"

interface TrainCardProps extends React.HTMLAttributes<HTMLDivElement> {
  trainNumber?: string
  departure?: string
  arrival?: string
  status?: 'on-time' | 'delayed' | 'departed'
  onClick?: () => void
}

const TrainCard = React.forwardRef<HTMLDivElement, TrainCardProps>(
  ({ className, trainNumber, departure, arrival, status = 'on-time', onClick, ...props }, ref) => {
    const statusColors = {
      'on-time': 'text-neon-mint',
      'delayed': 'text-yellow-400',
      'departed': 'text-muted-foreground',
    }

    return (
      <FuturisticCard
        ref={ref}
        className={cn(
          onClick && "cursor-pointer hover:border-electric-cyan hover:glow-border",
          className
        )}
        onClick={onClick}
        {...props}
      >
        <div className="space-y-4">
          {trainNumber && (
            <div className="flex items-center gap-2">
              <Train className="h-5 w-5 text-electric-cyan" />
              <span className="font-semibold text-lg">{trainNumber}</span>
            </div>
          )}
          {(departure || arrival) && (
            <div className="space-y-2">
              {departure && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Departure:</span>
                  <span className="font-medium">{departure}</span>
                </div>
              )}
              {arrival && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Arrival:</span>
                  <span className="font-medium">{arrival}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-medium", statusColors[status])}>
              {status.toUpperCase().replace('-', ' ')}
            </span>
          </div>
        </div>
      </FuturisticCard>
    )
  }
)
TrainCard.displayName = "TrainCard"

export { TrainCard }

