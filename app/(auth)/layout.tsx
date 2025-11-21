'use client'

import { NavBar } from '@/components/NavBar'

/**
 * Layout for authentication pages (login, register)
 * Provides a centered card layout with RailPay branding
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

