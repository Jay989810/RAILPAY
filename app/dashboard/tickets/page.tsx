'use client'

import { useEffect, useState } from 'react'
import { TicketCard } from '@/components/TicketCard'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { getUserTickets } from '@/lib/api'
import { Loader2, Train } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function TicketsPage() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<any[]>([])

  useEffect(() => {
    async function loadTickets() {
      try {
        const data = await getUserTickets()
        setTickets(data)
      } catch (error) {
        console.error('Error loading tickets:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTickets()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-electric-cyan" />
      </div>
    )
  }

  const formattedTickets = tickets.map((ticket) => ({
    id: ticket.id,
    routeName: ticket.route
      ? `${ticket.route.origin} → ${ticket.route.destination}`
      : 'Unknown Route',
    from: ticket.route?.origin || 'N/A',
    to: ticket.route?.destination || 'N/A',
    date: ticket.purchased_at,
    time: new Date(ticket.purchased_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    price: ticket.route?.base_price || 0,
    status:
      ticket.status === 'valid' || ticket.status === 'active'
        ? 'active'
        : ticket.status === 'used'
        ? 'used'
        : 'expired',
  }))

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-glow-cyan">My Tickets</h1>
        <p className="text-muted-foreground text-lg mt-2">
          View and manage all your tickets
        </p>
      </div>

      {formattedTickets.length === 0 ? (
        <GlassCard className="max-w-md mx-auto animate-scaleIn">
          <GlassCardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl bg-electric-cyan/20 p-6 border border-electric-cyan/30">
                <Train className="h-12 w-12 text-electric-cyan" />
              </div>
            </div>
            <GlassCardTitle className="text-2xl">No Tickets Yet</GlassCardTitle>
            <GlassCardDescription className="text-base">
              You do not have any tickets yet.
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Start your journey by purchasing your first ticket.
            </p>
            <GlowButton asChild>
              <Link href="/dashboard/buy">
                Buy Ticket
              </Link>
            </GlowButton>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formattedTickets.map((ticket, index) => (
            <div key={ticket.id} className="animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
              <TicketCard {...ticket} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
