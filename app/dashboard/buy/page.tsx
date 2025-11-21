'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GlowButton } from '@/components/ui/glow-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RouteCard } from '@/components/RouteCard'
import { SeatSelector } from '@/components/SeatSelector'
import { ClassSelector, type TravelClass } from '@/components/ClassSelector'
import { getRoutes, getVehicles, getProfile, buyTicket } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Loader2, AlertCircle, ArrowLeft, ArrowRightLeft } from 'lucide-react'
import Link from 'next/link'

export default function BuyTicketPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [routes, setRoutes] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [selectedRoute, setSelectedRoute] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<TravelClass | ''>('')
  const [selectedCoach, setSelectedCoach] = useState<string>('')
  const [seatNumber, setSeatNumber] = useState('')
  const [ticketType, setTicketType] = useState<'single' | 'return'>('single')
  const [error, setError] = useState('')
  const [reversedRoutes, setReversedRoutes] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function loadData() {
      try {
        const [routesData, vehiclesData, profileData] = await Promise.all([
          getRoutes(),
          getVehicles(),
          getProfile(),
        ])

        setRoutes(routesData)
        setVehicles(vehiclesData)
        setProfile(profileData)

        // Check if NIN is verified
        if (profileData && !profileData.nin_verified) {
          setError('You must verify your identity before purchasing tickets.')
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load routes. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const selectedRouteData = routes.find((r) => r.id === selectedRoute)
  const isReversed = selectedRoute ? reversedRoutes.has(selectedRoute) : false
  // Use a consistent vehicle selection based on route ID for better UX
  const selectedVehicle = vehicles.length > 0 
    ? vehicles[selectedRoute ? (selectedRoute.charCodeAt(0) % vehicles.length) : 0] 
    : null

  // Get coaches from vehicle metadata, filtered by selected class
  // Handle both JSONB object and string formats
  let allCoaches: any[] = []
  if (selectedVehicle?.metadata) {
    const metadata = selectedVehicle.metadata
    // If metadata is a string, parse it
    if (typeof metadata === 'string') {
      try {
        const parsed = JSON.parse(metadata)
        allCoaches = parsed.coaches || []
      } catch (e) {
        console.error('Error parsing metadata:', e)
      }
    } else if (metadata && typeof metadata === 'object') {
      // If it's already an object
      allCoaches = Array.isArray(metadata.coaches) ? metadata.coaches : []
    }
  }
  
  const coaches = selectedClass
    ? allCoaches.filter((coach: any) => {
        const coachClass = coach.class || coach.class_type || ''
        return coachClass.toLowerCase() === selectedClass.toLowerCase()
      })
    : []
  
  // Calculate price based on class multiplier
  const classMultipliers: Record<TravelClass, number> = {
    standard: 1.0,
    business: 1.5,
    first: 2.5,
  }
  const classPrice = selectedClass && selectedRouteData
    ? selectedRouteData.base_price * classMultipliers[selectedClass]
    : selectedRouteData?.base_price || 0

  const handleSwapDirection = (routeId: string) => {
    setReversedRoutes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(routeId)) {
        newSet.delete(routeId)
      } else {
        newSet.add(routeId)
      }
      return newSet
    })
  }

  const handleRouteSelect = (routeId: string) => {
    setSelectedRoute(routeId)
    setSelectedClass('')
    setSelectedCoach('')
    setSeatNumber('')
    setError('')
  }

  const handleClassSelect = (classType: TravelClass) => {
    setSelectedClass(classType)
    setSelectedCoach('') // Reset coach when class changes
    setSeatNumber('') // Reset seat when class changes
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    if (!selectedRoute) {
      setError('Please select a route')
      setSubmitting(false)
      return
    }

    if (!selectedClass) {
      setError('Please select a travel class')
      setSubmitting(false)
      return
    }

    if (!profile?.nin_verified) {
      setError('You must verify your identity before purchasing tickets.')
      setSubmitting(false)
      return
    }

    if (!isConnected || !address) {
      setError('Please connect your wallet before purchasing tickets.')
      setSubmitting(false)
      return
    }

    try {
      console.log('Submitting ticket purchase:', {
        routeId: selectedRoute,
        seatNumber: seatNumber || undefined,
        ticketType,
      })

      const result = await buyTicket({
        routeId: selectedRoute,
        seatNumber: seatNumber || undefined,
        ticketType,
      })

      console.log('Purchase result:', result)

      if (result.success && result.data) {
        router.push(`/dashboard/tickets/${result.data.id}`)
      } else {
        const errorMsg = result.message || 'Failed to purchase ticket'
        console.error('Purchase failed:', errorMsg)
        setError(errorMsg)
      }
    } catch (err: any) {
      console.error('Purchase error (catch):', err)
      setError(err.message || 'Failed to purchase ticket. Please check the console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-electric-cyan" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      <div className="flex items-center gap-4">
        <GlowButton variant="ghost" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </GlowButton>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-glow-cyan">Buy Ticket</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Select your route and purchase a ticket
          </p>
        </div>
      </div>

      {(!profile?.nin_verified || !isConnected) && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Requirements Not Met</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            {!profile?.nin_verified && (
              <p>You must verify your identity before purchasing tickets.</p>
            )}
            {!isConnected && (
              <p>Please connect your wallet before purchasing tickets.</p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {!profile?.nin_verified && (
                <GlowButton variant="outline" asChild>
                  <Link href="/auth/nin-verification">
                    Verify NIN Now
                  </Link>
                </GlowButton>
              )}
              {!isConnected && (
                <div className="[&>button]:!h-10 [&>button]:!px-4">
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
                                <GlowButton onClick={openConnectModal} type="button">
                                  Connect Wallet
                                </GlowButton>
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

      {!selectedRoute ? (
        // Route Selection View
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Available Routes</h2>
            <p className="text-muted-foreground">
              Select a route to view details and purchase a ticket
            </p>
          </div>

          {routes.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No routes available at the moment. Please check back later.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routes.map((route) => {
                const isReversed = reversedRoutes.has(route.id)
                // Use consistent vehicle selection based on route ID
                const vehicle = vehicles.length > 0 
                  ? vehicles[route.id.charCodeAt(0) % vehicles.length] 
                  : null

                return (
                  <RouteCard
                    key={route.id}
                    route={route}
                    vehicle={vehicle}
                    onSelect={handleRouteSelect}
                    onSwapDirection={() => handleSwapDirection(route.id)}
                    isReversed={isReversed}
                  />
                )
              })}
            </div>
          )}
        </div>
      ) : (
        // Ticket Details Form
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Complete Your Booking</CardTitle>
                    <CardDescription>
                      {isReversed
                        ? `${selectedRouteData?.destination} → ${selectedRouteData?.origin}`
                        : `${selectedRouteData?.origin} → ${selectedRouteData?.destination}`}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRoute('')
                      setSelectedClass('')
                      setSelectedCoach('')
                      setSeatNumber('')
                    }}
                  >
                    Change Route
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Class Selection */}
                  <ClassSelector
                    selectedClass={selectedClass}
                    onClassSelect={handleClassSelect}
                    basePrice={selectedRouteData?.base_price || 0}
                  />

                  {/* Coach Selection - Only show after class is selected */}
                  {selectedClass && coaches.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="coach">Select Coach *</Label>
                      <Select 
                        value={selectedCoach} 
                        onValueChange={(value) => {
                          setSelectedCoach(value)
                          setSeatNumber('') // Reset seat when coach changes
                        }} 
                        required
                      >
                        <SelectTrigger id="coach">
                          <SelectValue placeholder="Select a coach" />
                        </SelectTrigger>
                        <SelectContent>
                          {coaches.map((coach: any, idx: number) => (
                            <SelectItem key={idx} value={coach.name}>
                              {coach.name} ({coach.seats} seats) - {coach.class?.charAt(0).toUpperCase() + coach.class?.slice(1) || 'Standard'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedClass && coaches.length === 0 && allCoaches.length > 0 && (
                    <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                        No coaches available for {selectedClass} class on this route.
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-300 text-center mt-1">
                        Available classes: {[...new Set(allCoaches.map((c: any) => c.class || 'standard'))].join(', ')}
                      </p>
                    </div>
                  )}

                  {selectedClass && coaches.length === 0 && allCoaches.length === 0 && selectedVehicle && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground text-center">
                        No coach data available for this train. Please contact support.
                      </p>
                    </div>
                  )}

                  {selectedClass && coaches.length === 0 && !selectedVehicle && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground text-center">
                        Loading train information...
                      </p>
                    </div>
                  )}

                  {!selectedClass && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground text-center">
                        Please select a travel class to continue.
                      </p>
                    </div>
                  )}

                  {/* Seat Selection - Only show after coach is selected */}
                  {selectedCoach && selectedRoute && selectedClass && (
                    <div className="space-y-2">
                      {(() => {
                        const selectedCoachData = coaches.find((c: any) => c.name === selectedCoach)
                        return selectedCoachData ? (
                          <SeatSelector
                            coachName={selectedCoach}
                            totalSeats={selectedCoachData.seats}
                            routeId={selectedRoute}
                            selectedSeat={seatNumber}
                            onSeatSelect={setSeatNumber}
                          />
                        ) : null
                      })()}
                    </div>
                  )}

                  {selectedClass && selectedCoach && (
                    <div className="space-y-2">
                      <Label htmlFor="seat">Or Enter Seat Number Manually (Optional)</Label>
                      <Input
                        id="seat"
                        type="text"
                        placeholder="e.g., A12, B5"
                        value={seatNumber}
                        onChange={(e) => setSeatNumber(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        You can select a seat above or enter it manually
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label>Ticket Type *</Label>
                    <RadioGroup value={ticketType} onValueChange={(v) => setTicketType(v as 'single' | 'return')}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="single" />
                        <Label htmlFor="single" className="font-normal cursor-pointer">
                          Single Journey
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="return" id="return" />
                        <Label htmlFor="return" className="font-normal cursor-pointer">
                          Return Journey
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <GlowButton type="submit" className="w-full" disabled={submitting || !profile?.nin_verified || !isConnected || !selectedClass}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Complete Purchase'
                    )}
                  </GlowButton>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Route:</span>
                    <span className="font-medium">
                      {isReversed
                        ? `${selectedRouteData?.destination} → ${selectedRouteData?.origin}`
                        : `${selectedRouteData?.origin} → ${selectedRouteData?.destination}`}
                    </span>
                  </div>
                  {selectedVehicle && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Train:</span>
                      <span className="font-medium">
                        {selectedVehicle.vehicle_name} ({selectedVehicle.vehicle_number})
                      </span>
                    </div>
                  )}
                  {selectedCoach && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Coach:</span>
                      <span className="font-medium">{selectedCoach}</span>
                    </div>
                  )}
                  {seatNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Seat:</span>
                      <span className="font-medium">{seatNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">{ticketType}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Price:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(
                        (selectedRouteData?.base_price || 0) * (ticketType === 'return' ? 2 : 1)
                      )}
                    </span>
                  </div>
                  {ticketType === 'return' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Return tickets are priced at 2x the base fare
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
