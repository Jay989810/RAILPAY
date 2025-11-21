'use client'

import { useEffect, useState } from 'react'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { Ticket, DollarSign, TrendingUp, Users, ArrowRight, Plus, CreditCard, User } from 'lucide-react'
import Link from 'next/link'
import { TicketCard } from '@/components/TicketCard'
import { getProfile, getUserTickets, getActivePass } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [activePass, setActivePass] = useState<any>(null)
  const [stats, setStats] = useState({
    activeTickets: 0,
    activePasses: 0,
    lastTrip: null as { route: string; date: string } | null,
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, ticketsData, passData] = await Promise.all([
          getProfile(),
          getUserTickets(),
          getActivePass(),
        ])

        setProfile(profileData)
        setTickets(ticketsData)
        setActivePass(passData)

        // Calculate stats
        const activeTickets = ticketsData.filter(
          (t) => t.status === 'valid' || t.status === 'active'
        ).length

        const lastTicket = ticketsData[0]
        const lastTrip = lastTicket
          ? {
              route: lastTicket.route
                ? `${lastTicket.route.origin} → ${lastTicket.route.destination}`
                : 'N/A',
              date: formatDate(lastTicket.purchased_at),
            }
          : null

        setStats({
          activeTickets,
          activePasses: passData ? 1 : 0,
          lastTrip,
        })
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-electric-cyan" />
      </div>
    )
  }

  const recentTickets = tickets.slice(0, 2).map((ticket) => ({
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
    status: ticket.status === 'valid' ? 'active' : ticket.status === 'used' ? 'used' : 'expired',
  }))

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-glow-cyan">
            Welcome back, {profile?.full_name || 'User'}
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Here&apos;s your travel overview
          </p>
        </div>
        <GlowButton asChild>
          <Link href="/dashboard/buy">
            <Plus className="h-4 w-4 mr-2" />
            Buy Ticket
          </Link>
        </GlowButton>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="hover:scale-105 transition-transform duration-300 animate-fadeIn">
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Active Tickets</GlassCardTitle>
            <div className="h-10 w-10 rounded-xl bg-electric-cyan/20 flex items-center justify-center border border-electric-cyan/30">
              <Ticket className="h-5 w-5 text-electric-cyan" />
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold text-electric-cyan">{stats.activeTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently valid</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard className="hover:scale-105 transition-transform duration-300 animate-fadeIn delay-100">
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Active Passes</GlassCardTitle>
            <div className="h-10 w-10 rounded-xl bg-neon-mint/20 flex items-center justify-center border border-neon-mint/30">
              <CreditCard className="h-5 w-5 text-neon-mint" />
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold text-neon-mint">{stats.activePasses}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard className="hover:scale-105 transition-transform duration-300 animate-fadeIn delay-200">
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Last Trip</GlassCardTitle>
            <div className="h-10 w-10 rounded-xl bg-electric-cyan/20 flex items-center justify-center border border-electric-cyan/30">
              <TrendingUp className="h-5 w-5 text-electric-cyan" />
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-sm font-semibold text-foreground">
              {stats.lastTrip?.route || 'No trips yet'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.lastTrip?.date || 'N/A'}
            </p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard className="hover:scale-105 transition-transform duration-300 animate-fadeIn delay-300">
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Total Tickets</GlassCardTitle>
            <div className="h-10 w-10 rounded-xl bg-electric-cyan/20 flex items-center justify-center border border-electric-cyan/30">
              <Users className="h-5 w-5 text-electric-cyan" />
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold text-electric-cyan">{tickets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Recent Tickets */}
      {recentTickets.length > 0 && (
        <div className="animate-slideUp">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Recent Tickets</h2>
            <GlowButton variant="ghost" asChild>
              <Link href="/dashboard/tickets">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </GlowButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentTickets.map((ticket) => (
              <TicketCard key={ticket.id} {...ticket} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <GlassCard className="animate-fadeIn">
        <GlassCardHeader>
          <GlassCardTitle>Quick Actions</GlassCardTitle>
          <GlassCardDescription>Common tasks you might want to do</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlowButton variant="outline" asChild className="h-auto flex-col py-6">
              <Link href="/dashboard/buy">
                <Plus className="h-6 w-6 mb-2" />
                <span>Buy Ticket</span>
              </Link>
            </GlowButton>
            <GlowButton variant="outline" asChild className="h-auto flex-col py-6">
              <Link href="/dashboard/tickets">
                <Ticket className="h-6 w-6 mb-2" />
                <span>View My Tickets</span>
              </Link>
            </GlowButton>
            <GlowButton variant="outline" asChild className="h-auto flex-col py-6">
              <Link href="/dashboard/passes">
                <CreditCard className="h-6 w-6 mb-2" />
                <span>My Passes</span>
              </Link>
            </GlowButton>
            <GlowButton variant="outline" asChild className="h-auto flex-col py-6">
              <Link href="/dashboard/id-card">
                <User className="h-6 w-6 mb-2" />
                <span>My ID Card</span>
              </Link>
            </GlowButton>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
