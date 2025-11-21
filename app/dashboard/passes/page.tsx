'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPasses, createPass, getProfile } from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Loader2, CreditCard, Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'

export default function PassesPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)
  const [passes, setPasses] = useState<any[]>([])
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const profileData = await getProfile()
        setProfile(profileData)
        await loadPasses()
      } catch (err) {
        console.error('Error loading data:', err)
      }
    }
    loadData()
  }, [])

  async function loadPasses() {
    try {
      setLoading(true)
      const data = await getPasses()
      setPasses(data)
    } catch (err) {
      console.error('Error loading passes:', err)
      setError('Failed to load passes')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreatePass(passType: 'daily' | 'weekly' | 'monthly') {
    try {
      setCreating(passType)
      setError('')

      if (!profile?.nin_verified) {
        setError('You must verify your identity before purchasing passes.')
        setCreating(null)
        return
      }

      if (!isConnected || !address) {
        setError('Please connect your wallet before purchasing passes.')
        setCreating(null)
        return
      }

      const result = await createPass(passType)

      if (result.success) {
        await loadPasses()
      } else {
        setError(result.message || 'Failed to create pass')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create pass')
    } finally {
      setCreating(null)
    }
  }

  const activePass = passes.find((p) => {
    const now = new Date().toISOString()
    return p.status === 'active' && p.expires_at > now
  })

  const passPrices: Record<string, number> = {
    daily: 10,
    weekly: 50,
    monthly: 150,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Passes</h1>
        <p className="text-muted-foreground">
          Manage your travel passes
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(!profile?.nin_verified || !isConnected) && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Requirements Not Met</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            {!profile?.nin_verified && (
              <p>You must verify your identity before purchasing passes.</p>
            )}
            {!isConnected && (
              <p>Please connect your wallet before purchasing passes.</p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {!profile?.nin_verified && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/auth/nin-verification">
                    Verify NIN Now
                  </Link>
                </Button>
              )}
              {!isConnected && (
                <div className="[&>button]:!h-9 [&>button]:!px-4 [&>button]:!text-sm">
                  <ConnectButton.Custom>
                    {({
                      account,
                      chain,
                      openAccountModal,
                      openChainModal,
                      openConnectModal,
                      authenticationStatus,
                      mounted,
                    }) => {
                      const ready = mounted && authenticationStatus !== 'loading'
                      const connected =
                        ready &&
                        account &&
                        chain &&
                        (!authenticationStatus ||
                          authenticationStatus === 'authenticated')

                      return (
                        <div
                          {...(!ready && {
                            'aria-hidden': true,
                            style: {
                              opacity: 0,
                              pointerEvents: 'none',
                              userSelect: 'none',
                            },
                          })}
                        >
                          {(() => {
                            if (!connected) {
                              return (
                                <Button variant="outline" size="sm" onClick={openConnectModal} type="button">
                                  Connect Wallet
                                </Button>
                              )
                            }
                            return null
                          })()}
                        </div>
                      )
                    }}
                  </ConnectButton.Custom>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Active Pass */}
      {activePass && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Active Pass
                </CardTitle>
                <CardDescription>
                  {activePass.pass_type.charAt(0).toUpperCase() + activePass.pass_type.slice(1)} Pass
                </CardDescription>
              </div>
              <Badge className="bg-green-500">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Starts At</p>
                <p className="font-medium">{formatDate(activePass.starts_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expires At</p>
                <p className="font-medium">{formatDate(activePass.expires_at)}</p>
              </div>
            </div>
            {activePass.blockchain_tx_hash && (
              <div>
                <p className="text-sm text-muted-foreground">Transaction Hash</p>
                <p className="font-mono text-sm">{activePass.blockchain_tx_hash.slice(0, 20)}...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Purchase New Pass */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase New Pass</CardTitle>
          <CardDescription>
            Choose a pass type to purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['daily', 'weekly', 'monthly'] as const).map((passType) => (
              <Card key={passType} className="relative">
                <CardHeader>
                  <CardTitle className="capitalize">{passType} Pass</CardTitle>
                  <CardDescription>
                    {passType === 'daily' && 'Valid for 24 hours'}
                    {passType === 'weekly' && 'Valid for 7 days'}
                    {passType === 'monthly' && 'Valid for 30 days'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(passPrices[passType])}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleCreatePass(passType)}
                    disabled={creating === passType || !profile?.nin_verified || !isConnected}
                  >
                    {creating === passType ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Buy {passType.charAt(0).toUpperCase() + passType.slice(1)} Pass
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pass History */}
      {passes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pass History</CardTitle>
            <CardDescription>All your passes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {passes.map((pass) => {
                const isExpired = new Date(pass.expires_at).toISOString() < new Date().toISOString()
                return (
                  <div
                    key={pass.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium capitalize">{pass.pass_type} Pass</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(pass.starts_at)} - {formatDate(pass.expires_at)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={isExpired ? 'secondary' : 'default'}
                      className={!isExpired ? 'bg-green-500' : ''}
                    >
                      {isExpired ? 'Expired' : pass.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
