'use client'

import { Sidebar } from '@/components/Sidebar'
import { NavBar } from '@/components/NavBar'
import { useAuthStore } from '@/lib/store'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Loader2 } from 'lucide-react'

// Routes that require NIN verification
const NIN_VERIFIED_ROUTES = [
  '/dashboard/tickets',
  '/dashboard/buy',
  '/pay',
  '/dashboard/passes',
  '/qr/generate',
  '/qr/scan',
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [checkingNin, setCheckingNin] = useState(true)
  const [ninVerified, setNinVerified] = useState(false)

  const checkNinVerification = useCallback(async () => {
    if (!user?.id) {
      setCheckingNin(false)
      return
    }

    const userId = user.id

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nin_verified')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (!data?.nin_verified) {
        router.push('/auth/nin-verification?message=You must verify your identity before purchasing tickets.')
        return
      }

      setNinVerified(true)
    } catch (err) {
      console.error('Error checking NIN verification:', err)
    } finally {
      setCheckingNin(false)
    }
  }, [user?.id, router])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    // Check if current route requires NIN verification
    const requiresNin = NIN_VERIFIED_ROUTES.some(route => pathname?.startsWith(route))
    
    if (requiresNin && user?.id) {
      checkNinVerification()
    } else {
      setCheckingNin(false)
    }
  }, [isAuthenticated, user, pathname, router, checkNinVerification])

  if (!isAuthenticated) {
    return null
  }

  if (checkingNin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      <NavBar />
      <Sidebar isAdmin={user?.role === 'admin'} />
      <main className="lg:ml-64 pt-16 animate-fadeIn">
        <div className="container mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

