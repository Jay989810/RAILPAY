'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GlowButton } from '@/components/ui/glow-button'
import { GlowInput } from '@/components/ui/glow-input'
import { Label } from '@/components/ui/label'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase-client'
import { Train } from 'lucide-react'
import { NavBar } from '@/components/NavBar'

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
        }

        // Set user in store
        setUser({
          id: authData.user.id,
          email: authData.user.email || email,
          name: profile?.full_name || email.split('@')[0],
          role: profile?.role || 'user',
        })
        setToken(authData.session?.access_token || '')

        // Redirect to dashboard (user can verify NIN later if needed)
        router.push('/dashboard')
      } else {
        setError('Login failed - no user returned')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-deep-space via-midnight-navy to-deep-space" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-electric-cyan/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-mint/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <NavBar />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 pt-24">
        <GlassCard className="w-full max-w-md animate-scaleIn glow-border">
          <GlassCardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-2xl bg-electric-cyan/20 flex items-center justify-center border border-electric-cyan/30 glow-border">
                <Train className="h-8 w-8 text-electric-cyan" />
              </div>
            </div>
            <GlassCardTitle className="text-3xl font-bold text-glow-cyan">Welcome back</GlassCardTitle>
            <GlassCardDescription className="text-base">
              Enter your credentials to access your account
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <GlowInput
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <Link
                    href="#"
                    className="text-sm text-electric-cyan hover:text-neon-mint transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <GlowInput
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/30">
                  {error}
                </div>
              )}
              <GlowButton type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </GlowButton>
            </form>
          </GlassCardContent>
          <GlassCardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-electric-cyan hover:text-neon-mint transition-colors font-semibold">
                Sign up
              </Link>
            </div>
          </GlassCardFooter>
        </GlassCard>
      </div>
    </div>
  )
}

