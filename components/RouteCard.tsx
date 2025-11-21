'use client'

import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { ArrowRightLeft, Clock, MapPin, Train } from 'lucide-react'
import Image from 'next/image'

interface RouteCardProps {
  route: {
    id: string
    origin: string
    destination: string
    vehicle_type: string
    base_price: number
    estimated_minutes: number | null
    active: boolean
  }
  vehicle?: {
    id: string
    vehicle_name: string | null
    vehicle_number: string | null
    image_url: string | null
  } | null
  onSelect: (routeId: string) => void
  onSwapDirection?: () => void
  isReversed?: boolean
}

// Generate sample departure times
function getDepartureTimes(): string[] {
  return ['7:00 AM', '11:00 AM', '2:30 PM', '6:15 PM']
}

export function RouteCard({
  route,
  vehicle,
  onSelect,
  onSwapDirection,
  isReversed = false,
}: RouteCardProps) {
  const displayOrigin = isReversed ? route.destination : route.origin
  const displayDestination = isReversed ? route.origin : route.destination
  const departureTimes = getDepartureTimes()
  const trainImage = vehicle?.image_url || 'https://unsplash.com/photos/3ba59K57wE4/download?w=800&h=600&fit=crop'

  return (
    <GlassCard className="overflow-hidden hover:scale-[1.02] hover:glow-border transition-all duration-300 animate-fadeIn">
      <div className="relative h-48 w-full rounded-t-2xl overflow-hidden">
        <Image
          src={trainImage}
          alt={`${vehicle?.vehicle_name || 'Train'} - ${displayOrigin} to ${displayDestination}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-space/90 via-deep-space/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between text-white">
            <div>
              <h3 className="text-lg font-bold text-glow-cyan">
                {displayOrigin} → {displayDestination}
              </h3>
              {vehicle && (
                <p className="text-sm text-white/90 flex items-center gap-1 mt-1">
                  <Train className="h-3 w-3" />
                  {vehicle.vehicle_name} ({vehicle.vehicle_number})
                </p>
              )}
            </div>
            {onSwapDirection && (
              <GlowButton
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onSwapDirection()
                }}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
              >
                <ArrowRightLeft className="h-4 w-4 mr-1" />
                Swap
              </GlowButton>
            )}
          </div>
        </div>
      </div>

      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <GlassCardTitle className="text-xl">
            {displayOrigin} → {displayDestination}
          </GlassCardTitle>
          <Badge variant="outline" className="border-electric-cyan/50 text-electric-cyan">
            {route.vehicle_type}
          </Badge>
        </div>
        {vehicle && (
          <GlassCardDescription className="flex items-center gap-2">
            <Train className="h-4 w-4 text-electric-cyan" />
            {vehicle.vehicle_name} ({vehicle.vehicle_number})
          </GlassCardDescription>
        )}
      </GlassCardHeader>

      <GlassCardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-electric-cyan" />
            <span>
              {route.estimated_minutes
                ? `${Math.floor(route.estimated_minutes / 60)}h ${route.estimated_minutes % 60}m`
                : 'N/A'}
            </span>
          </div>
          <div className="text-2xl font-bold text-electric-cyan">
            {formatCurrency(route.base_price)}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Next Departures:</p>
          <div className="flex flex-wrap gap-2">
            {departureTimes.map((time, idx) => (
              <Badge key={idx} variant="outline" className="text-xs border-electric-cyan/30 text-electric-cyan">
                {time}
              </Badge>
            ))}
          </div>
        </div>

        <GlowButton
          className="w-full"
          onClick={() => onSelect(route.id)}
        >
          Select Route
        </GlowButton>
      </GlassCardContent>
    </GlassCard>
  )
}

