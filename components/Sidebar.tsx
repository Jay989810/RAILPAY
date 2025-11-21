'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Ticket,
  CreditCard,
  User,
  QrCode,
  Settings,
  Train,
  DollarSign,
  Users,
  Cpu,
  Menu,
  X,
  CheckCircle,
} from 'lucide-react'
import { useState } from 'react'
import { GlowButton } from './ui/glow-button'

interface SidebarProps {
  isAdmin?: boolean
}

const userNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/tickets', label: 'My Tickets', icon: Ticket },
  { href: '/dashboard/passes', label: 'My Passes', icon: CreditCard },
  { href: '/dashboard/id-card', label: 'My ID Card', icon: User },
]

const adminNavItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/scan', label: 'Scan Tickets', icon: QrCode },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/routes', label: 'Routes', icon: Train },
  { href: '/admin/fares', label: 'Fares', icon: DollarSign },
  { href: '/admin/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/admin/staff', label: 'Staff', icon: Users },
  { href: '/admin/devices', label: 'Devices', icon: Cpu },
  { href: '/admin/operations', label: 'Operations', icon: Settings },
]

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const navItems = isAdmin ? adminNavItems : userNavItems

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-20 left-4 z-50">
        <GlowButton
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="glass"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </GlowButton>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 glass border-r border-electric-cyan/20 transition-transform duration-300',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8 px-2 pt-4">
            <div className="h-10 w-10 rounded-xl bg-electric-cyan/20 flex items-center justify-center border border-electric-cyan/30">
              <Train className="h-6 w-6 text-electric-cyan" />
            </div>
            <span className="text-xl font-bold text-glow-cyan">RailPay</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative group',
                    isActive
                      ? 'bg-electric-cyan/20 text-electric-cyan border border-electric-cyan/50 glow-border'
                      : 'text-muted-foreground hover:bg-electric-cyan/10 hover:text-electric-cyan hover:border hover:border-electric-cyan/30'
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-300",
                    isActive && "scale-110"
                  )} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute right-2 h-2 w-2 rounded-full bg-electric-cyan animate-glowPulse" />
                  )}
                </Link>
              )
            })}
          </nav>

        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}

