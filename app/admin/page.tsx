'use client'

import { useEffect, useState } from 'react'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Train, DollarSign, Users, TrendingUp, Ticket, Route, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { adminGetStats, adminGetPayments, adminGetTicketPassStats } from '@/lib/api'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [ticketPassStats, setTicketPassStats] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, paymentsData, ticketPassData] = await Promise.all([
          adminGetStats(),
          adminGetPayments(),
          adminGetTicketPassStats(),
        ])

        setStats(statsData)
        setRecentPayments(paymentsData.slice(0, 10))
        setTicketPassStats(ticketPassData)
      } catch (error) {
        console.error('Error loading admin data:', error)
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

  if (!stats) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-glow-cyan">Admin Dashboard</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Overview of your railway system
          </p>
        </div>
        <GlassCard>
          <GlassCardContent className="pt-6">
            <p className="text-muted-foreground">Failed to load statistics</p>
          </GlassCardContent>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-glow-cyan">Admin Dashboard</h1>
        <p className="text-muted-foreground text-lg mt-2">
          Overview of your railway system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="hover:scale-105 transition-transform duration-300 animate-fadeIn">
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Total Revenue</GlassCardTitle>
            <div className="h-10 w-10 rounded-xl bg-electric-cyan/20 flex items-center justify-center border border-electric-cyan/30">
              <DollarSign className="h-5 w-5 text-electric-cyan" />
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold text-electric-cyan">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time revenue
            </p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard className="hover:scale-105 transition-transform duration-300 animate-fadeIn delay-100">
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Total Tickets</GlassCardTitle>
            <div className="h-10 w-10 rounded-xl bg-neon-mint/20 flex items-center justify-center border border-neon-mint/30">
              <Ticket className="h-5 w-5 text-neon-mint" />
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold text-neon-mint">{stats.totalTickets.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard className="hover:scale-105 transition-transform duration-300 animate-fadeIn delay-200">
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Active Routes</GlassCardTitle>
            <div className="h-10 w-10 rounded-xl bg-electric-cyan/20 flex items-center justify-center border border-electric-cyan/30">
              <Route className="h-5 w-5 text-electric-cyan" />
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold text-electric-cyan">{stats.activeRoutes}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard className="hover:scale-105 transition-transform duration-300 animate-fadeIn delay-300">
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Active Passes</GlassCardTitle>
            <div className="h-10 w-10 rounded-xl bg-neon-mint/20 flex items-center justify-center border border-neon-mint/30">
              <Users className="h-5 w-5 text-neon-mint" />
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold text-neon-mint">{stats.activePasses}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Recent Payments */}
      <GlassCard className="animate-fadeIn">
        <GlassCardHeader>
          <GlassCardTitle>Recent Payments</GlassCardTitle>
          <GlassCardDescription>Latest ticket purchases and payments</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {recentPayments.length === 0 ? (
            <p className="text-muted-foreground">No recent payments</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-electric-cyan/20 glass hover:border-electric-cyan/40 hover:glow-border transition-all duration-300"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">Payment #{payment.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.payment_method || 'Unknown method'}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-electric-cyan text-lg">{formatCurrency(payment.amount || 0)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Ticket and Pass Statistics */}
      {ticketPassStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard className="animate-fadeIn">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-electric-cyan" />
                Ticket Statistics
              </GlassCardTitle>
              <GlassCardDescription>Detailed breakdown of all tickets</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl border border-electric-cyan/20 glass">
                  <div className="text-2xl font-bold text-electric-cyan">
                    {ticketPassStats.tickets.total.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Total Tickets</div>
                </div>
                <div className="text-center p-4 rounded-xl border border-neon-mint/20 glass">
                  <div className="text-2xl font-bold text-neon-mint">
                    {ticketPassStats.tickets.active.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Active</div>
                </div>
                <div className="text-center p-4 rounded-xl border border-muted glass">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {ticketPassStats.tickets.used.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Used</div>
                </div>
              </div>
              <div className="pt-4 border-t border-electric-cyan/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Rate</span>
                  <span className="font-semibold">
                    {ticketPassStats.tickets.total > 0
                      ? (
                          (ticketPassStats.tickets.active / ticketPassStats.tickets.total) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="animate-fadeIn">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-neon-mint" />
                Pass Statistics
              </GlassCardTitle>
              <GlassCardDescription>Detailed breakdown of all passes</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-xl border border-electric-cyan/20 glass">
                  <div className="text-2xl font-bold text-electric-cyan">
                    {ticketPassStats.passes.total.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Total Passes</div>
                </div>
                <div className="text-center p-4 rounded-xl border border-neon-mint/20 glass">
                  <div className="text-2xl font-bold text-neon-mint">
                    {ticketPassStats.passes.active.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Active</div>
                </div>
              </div>
              <div className="pt-4 border-t border-neon-mint/20">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Daily Passes</span>
                    <span className="font-semibold">{ticketPassStats.passes.daily.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Weekly Passes</span>
                    <span className="font-semibold">{ticketPassStats.passes.weekly.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Passes</span>
                    <span className="font-semibold">{ticketPassStats.passes.monthly.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      )}

      {/* Simple Chart Placeholder */}
      <GlassCard className="animate-fadeIn">
        <GlassCardHeader>
          <GlassCardTitle>Tickets Sold Over Time</GlassCardTitle>
          <GlassCardDescription>Simple visualization of ticket sales</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground rounded-xl border border-electric-cyan/20 glass">
            <p>Chart visualization coming soon. Install recharts or chart.js for full functionality.</p>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
