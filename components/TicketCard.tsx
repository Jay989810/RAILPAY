'use client'

import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from './ui/glass-card'
import { GlowButton } from './ui/glow-button'
import { Badge } from './ui/badge'
import { Ticket, MapPin, Clock, DollarSign, QrCode, ArrowRight } from 'lucide-react'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface TicketCardProps {
  id: string
  routeName: string
  from: string
  to: string
  date: string
  time: string
  price: number
  status: 'active' | 'used' | 'expired'
  qrCode?: string
}

export function TicketCard({
  id,
  routeName,
  from,
  to,
  date,
  time,
  price,
  status,
}: TicketCardProps) {
  const statusColors = {
    active: 'bg-neon-mint text-deep-space border-neon-mint/50',
    used: 'bg-muted text-muted-foreground border-muted',
    expired: 'bg-destructive/20 text-destructive border-destructive/30',
  }

  return (
    <GlassCard className="w-full hover:scale-[1.02] hover:glow-border transition-all duration-300 animate-fadeIn">
      <GlassCardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-electric-cyan/20 flex items-center justify-center border border-electric-cyan/30">
              <Ticket className="h-5 w-5 text-electric-cyan" />
            </div>
            <GlassCardTitle className="text-lg">{routeName}</GlassCardTitle>
          </div>
          <Badge
            className={`${statusColors[status]} border font-semibold`}
            variant="outline"
          >
            {status.toUpperCase()}
          </Badge>
        </div>
        <GlassCardDescription className="text-xs">Ticket ID: {id.slice(0, 8)}</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-electric-cyan" />
          <span className="font-medium text-foreground">{from}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{to}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formatDate(date)}</span>
          <span>•</span>
          <span>{formatTime(time)}</span>
        </div>
        <div className="flex items-center gap-2 text-xl font-bold text-electric-cyan">
          <DollarSign className="h-5 w-5" />
          <span>{formatCurrency(price)}</span>
        </div>
      </GlassCardContent>
      <GlassCardFooter className="flex gap-2">
        <GlowButton asChild variant="outline" className="flex-1">
          <Link href={`/dashboard/tickets/${id}`}>
            View Details
          </Link>
        </GlowButton>
        {status === 'active' && (
          <GlowButton asChild className="flex-1">
            <Link href={`/qr/generate?id=${id}`}>
              <QrCode className="h-4 w-4 mr-2" />
              Show QR
            </Link>
          </GlowButton>
        )}
      </GlassCardFooter>
    </GlassCard>
  )
}

