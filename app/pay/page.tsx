'use client'

import { RouteSelector } from '@/components/RouteSelector'
import { PaymentModal } from '@/components/PaymentModal'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ArrowRight } from 'lucide-react'

export default function PayPage() {
  const [selectedRoute, setSelectedRoute] = useState<{ id: string; price: number } | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)

  const handleBookNow = (routeId: string, price: number) => {
    setSelectedRoute({ id: routeId, price })
    setPaymentOpen(true)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Book Your Ticket</h1>
        <p className="text-muted-foreground">
          Search for routes and book your journey
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RouteSelector onRouteSelect={handleBookNow} />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Booking Summary
              </CardTitle>
              <CardDescription>Review your booking details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedRoute ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-xl font-bold">${selectedRoute.price}</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => setPaymentOpen(true)}
                  >
                    Proceed to Payment
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select a route to continue
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        amount={selectedRoute?.price || 0}
        routeId={selectedRoute?.id}
        ticketType="single"
        onSuccess={() => {
          // Ticket QR code will be shown in PaymentModal
        }}
      />
    </div>
  )
}

