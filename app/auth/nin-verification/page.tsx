'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase-client'
import { verifyNin } from '@/lib/supabase-edge-functions'
import { Train, AlertCircle, CheckCircle } from 'lucide-react'

export default function NinVerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [nin, setNin] = useState('')

  const message = searchParams.get('message') || ''

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Fetch user profile data
    async function fetchProfile() {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, dob, phone, nin, nin_verified')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
        }

        if (profile) {
          if (profile.nin_verified) {
            router.push('/dashboard/id-card')
            return
          }

          setFullName(profile.full_name || '')
          setDob(profile.dob || '')
          setPhone(profile.phone || '')
          setNin(profile.nin || '')
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setFetching(false)
      }
    }

    fetchProfile()
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    if (!nin || !fullName || !dob || !phone) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    // Validate NIN format (should be 11 digits)
    if (!/^\d{11}$/.test(nin)) {
      setError('NIN must be exactly 11 digits')
      setLoading(false)
      return
    }

    try {
      const result = await verifyNin(supabase, {
        nin,
        fullName,
        dob,
        phone,
      })

      if (result.success) {
        setSuccess(true)
        // Redirect to ID card page after 1 second
        setTimeout(() => {
          router.push('/dashboard/id-card')
        }, 1500)
      } else {
        setError(result.message || 'NIN verification failed')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify NIN. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Train className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">NIN Verification</CardTitle>
          <CardDescription>
            Verify your National Identification Number to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                NIN verified successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading || success}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                disabled={loading || success}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+2341234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading || success}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nin">National Identification Number (NIN)</Label>
              <Input
                id="nin"
                type="text"
                placeholder="12345678901"
                value={nin}
                onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                maxLength={11}
                required
                disabled={loading || success}
              />
              <p className="text-xs text-muted-foreground">
                Enter your 11-digit NIN
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading || success}>
              {loading ? 'Verifying...' : success ? 'Verified!' : 'Verify NIN'}
            </Button>
          </form>

          <div className="mt-4 text-sm text-center text-muted-foreground">
            <p>This verification is required to purchase tickets and access certain features.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
