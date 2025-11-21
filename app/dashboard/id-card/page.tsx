'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DigitalIDCard } from '@/components/DigitalIDCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase-client'
import { getDigitalIdCard } from '@/lib/supabase-edge-functions'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function IdCardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [idData, setIdData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    async function fetchIdCard() {
      if (!user?.id) return
      
      try {
        // Check if NIN is verified first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('nin_verified')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          // If profile doesn't exist, redirect to NIN verification to create profile
          router.push('/auth/nin-verification?message=Please create and verify your profile to view your ID card')
          return
        }

        if (!profile.nin_verified) {
          router.push('/auth/nin-verification?message=Please verify your NIN to view your ID card')
          return
        }

        // Fetch digital ID card data
        const result = await getDigitalIdCard(supabase)

        if (result.success && result.data) {
          // Use nin_verified from result if available, otherwise use from profile check
          setIdData({ 
            ...result.data, 
            nin_verified: result.data.nin_verified ?? profile.nin_verified 
          })
        } else {
          setError(result.message || 'Failed to load ID card')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load ID card')
      } finally {
        setLoading(false)
      }
    }

    fetchIdCard()
  }, [user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-destructive mb-2">{error}</p>
            <p className="text-sm text-muted-foreground mb-4">
              You need to verify your profile to view your ID card and purchase tickets.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push('/auth/nin-verification?message=Please verify your profile to continue')}>
                Verify Profile
              </Button>
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!idData) {
    return null
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Digital ID Card</h1>
          <p className="text-muted-foreground">
            Your verified RailPay identity card
          </p>
        </div>
      </div>

      {!idData.nin_verified && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Identity Verification Required
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  You must verify your NIN to access all features and purchase tickets.
                </p>
              </div>
              <Button asChild>
                <Link href="/auth/nin-verification">
                  Complete Verification
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DigitalIDCard
        userId={idData.id}
        fullName={idData.full_name}
        photoUrl={idData.photo_url}
        nin={idData.nin}
        walletAddress={idData.wallet_address}
        ninVerifiedAt={idData.nin_verified_at}
        ninVerified={idData.nin_verified}
      />
    </div>
  )
}
