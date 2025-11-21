'use client'

import Link from 'next/link'
import { GlowButton } from '@/components/ui/glow-button'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { SectionHeader } from '@/components/ui/section-header'
import { Badge } from '@/components/ui/badge'
import { NavBar } from '@/components/NavBar'
import { Train, Zap, Shield, CreditCard, ArrowRight, Smartphone, QrCode, CheckCircle, User, Ticket, Settings } from 'lucide-react'
import { useAuthStore } from '@/lib/store'

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore()
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-deep-space via-midnight-navy to-deep-space" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-electric-cyan/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-mint/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <NavBar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto animate-fadeIn">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-electric-cyan/30 text-electric-cyan animate-slideUp">
            <Train className="h-5 w-5" />
            <span className="text-sm font-medium">Modern Railway Payment System</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-glow-cyan animate-slideUp">
            Smart Rail & Transport Payments for Africa
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl animate-slideUp">
            RailPay makes tickets, passes, and identity seamless for modern mobility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-scaleIn">
            <GlowButton asChild size="lg" className="text-lg px-8">
              <Link href="/auth/register">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </GlowButton>
            <GlowButton asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href={isAuthenticated ? '/dashboard/buy' : '/auth/login'}>
                Buy Ticket
              </Link>
            </GlowButton>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <SectionHeader 
          title="Features" 
          description="Everything you need for a seamless travel experience"
          glow
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="animate-fadeIn hover:scale-105 transition-transform duration-300">
            <GlassCardHeader>
              <div className="h-12 w-12 rounded-xl bg-electric-cyan/20 flex items-center justify-center mb-4 border border-electric-cyan/30">
                <User className="h-6 w-6 text-electric-cyan" />
              </div>
              <GlassCardTitle>Digital ID Card</GlassCardTitle>
              <GlassCardDescription>
                Verified identity with NIN integration for secure travel
              </GlassCardDescription>
            </GlassCardHeader>
          </GlassCard>
          <GlassCard className="animate-fadeIn hover:scale-105 transition-transform duration-300 delay-100">
            <GlassCardHeader>
              <div className="h-12 w-12 rounded-xl bg-electric-cyan/20 flex items-center justify-center mb-4 border border-electric-cyan/30">
                <Ticket className="h-6 w-6 text-electric-cyan" />
              </div>
              <GlassCardTitle>Smart Ticketing</GlassCardTitle>
              <GlassCardDescription>
                Book tickets instantly with QR code validation
              </GlassCardDescription>
            </GlassCardHeader>
          </GlassCard>
          <GlassCard className="animate-fadeIn hover:scale-105 transition-transform duration-300 delay-200">
            <GlassCardHeader>
              <div className="h-12 w-12 rounded-xl bg-electric-cyan/20 flex items-center justify-center mb-4 border border-electric-cyan/30">
                <CreditCard className="h-6 w-6 text-electric-cyan" />
              </div>
              <GlassCardTitle>Travel Passes</GlassCardTitle>
              <GlassCardDescription>
                Daily, weekly, and monthly passes for frequent travelers
              </GlassCardDescription>
            </GlassCardHeader>
          </GlassCard>
          <GlassCard className="animate-fadeIn hover:scale-105 transition-transform duration-300 delay-300">
            <GlassCardHeader>
              <div className="h-12 w-12 rounded-xl bg-electric-cyan/20 flex items-center justify-center mb-4 border border-electric-cyan/30">
                <Settings className="h-6 w-6 text-electric-cyan" />
              </div>
              <GlassCardTitle>Admin Tools</GlassCardTitle>
              <GlassCardDescription>
                Comprehensive management dashboard for operators
              </GlassCardDescription>
            </GlassCardHeader>
          </GlassCard>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <GlassCard className="border-electric-cyan/30">
          <GlassCardHeader className="text-center space-y-4">
            <SectionHeader 
              title="How It Works" 
              description="Three simple steps to your destination"
            />
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center space-y-4 animate-fadeIn">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-electric-cyan to-neon-mint text-deep-space flex items-center justify-center text-3xl font-bold mx-auto glow-cyan">
                  1
                </div>
                <h3 className="text-xl font-semibold text-foreground">Search & Select</h3>
                <p className="text-muted-foreground">
                  Find your route and choose your preferred time
                </p>
              </div>
              <div className="text-center space-y-4 animate-fadeIn delay-200">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-electric-cyan to-neon-mint text-deep-space flex items-center justify-center text-3xl font-bold mx-auto glow-cyan">
                  2
                </div>
                <h3 className="text-xl font-semibold text-foreground">Pay Securely</h3>
                <p className="text-muted-foreground">
                  Complete payment with your preferred method
                </p>
              </div>
              <div className="text-center space-y-4 animate-fadeIn delay-400">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-electric-cyan to-neon-mint text-deep-space flex items-center justify-center text-3xl font-bold mx-auto glow-cyan">
                  3
                </div>
                <h3 className="text-xl font-semibold text-foreground">Travel</h3>
                <p className="text-muted-foreground">
                  Show your QR code ticket and enjoy your journey
                </p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <GlassCard className="border-electric-cyan/50 glow-border">
          <GlassCardHeader className="text-center space-y-4">
            <GlassCardTitle className="text-3xl md:text-4xl text-glow-cyan">Ready to Get Started?</GlassCardTitle>
            <GlassCardDescription className="text-lg">
              Join thousands of travelers using RailPay every day
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="flex flex-col sm:flex-row gap-4 justify-center">
            <GlowButton asChild size="lg" className="text-lg px-8">
              <Link href="/auth/register">
                Create Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </GlowButton>
            <GlowButton asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/auth/login">Sign In</Link>
            </GlowButton>
          </GlassCardContent>
        </GlassCard>
      </section>

      {/* Built on Ethereum Sepolia Badge */}
      <section className="container mx-auto px-4 py-8 relative z-10">
        <div className="text-center">
          <Badge variant="outline" className="text-sm border-electric-cyan/30 text-electric-cyan glass">
            Built on Ethereum Sepolia
          </Badge>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-electric-cyan/20 mt-20 relative z-10">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Train className="h-6 w-6 text-electric-cyan" />
                <span className="text-xl font-bold text-glow-cyan">RailPay</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Modern railway payment and ticketing system
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/dashboard" className="hover:text-electric-cyan transition-colors">Dashboard</Link></li>
                <li><Link href="/dashboard/tickets" className="hover:text-electric-cyan transition-colors">Tickets</Link></li>
                <li><Link href="/dashboard/passes" className="hover:text-electric-cyan transition-colors">Passes</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-electric-cyan transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-electric-cyan transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-electric-cyan transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-electric-cyan transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-electric-cyan transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-electric-cyan/20 mt-12 pt-8 text-center text-sm text-muted-foreground">
            © 2024 RailPay. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

