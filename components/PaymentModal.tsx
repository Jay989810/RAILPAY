'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { CreditCard, Wallet, Smartphone } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { createTicket } from '@/lib/supabase-edge-functions'
import { supabase } from '@/lib/supabase-client'
import { TicketQRCode } from './TicketQRCode'

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  routeId?: string
  seatNumber?: string
  ticketType?: 'single' | 'return'
  onSuccess?: () => void
}

export function PaymentModal({ 
  open, 
  onOpenChange, 
  amount, 
  routeId,
  seatNumber,
  ticketType = 'single',
  onSuccess 
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [processing, setProcessing] = useState(false)
  const [purchasedTicket, setPurchasedTicket] = useState<any>(null)
  const [route, setRoute] = useState<any>(null)

  // Fetch route details when routeId is provided
  useEffect(() => {
    if (routeId && open) {
      supabase
        .from('routes')
        .select('*')
        .eq('id', routeId)
        .single()
        .then(({ data }) => {
          if (data) setRoute(data)
        })
    }
  }, [routeId, open])

  const handlePayment = async () => {
    if (!routeId) {
      alert('Route ID is required')
      return
    }

    setProcessing(true)
    
    try {
      // Simulate payment processing first
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Create ticket via Edge Function
      const result = await createTicket(supabase, {
        routeId,
        seatNumber,
        ticketType,
      })

      if (result.success && result.data) {
        setPurchasedTicket(result.data)
        onSuccess?.()
      } else {
        alert(result.message || 'Failed to create ticket')
        setProcessing(false)
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      alert(error.message || 'Payment failed')
      setProcessing(false)
    }
  }

  const handleCloseTicket = () => {
    setPurchasedTicket(null)
    onOpenChange(false)
  }

  // Show ticket QR code if ticket was purchased
  if (purchasedTicket) {
    return (
      <TicketQRCode
        ticket={purchasedTicket}
        route={route}
        onClose={handleCloseTicket}
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Pay {formatCurrency(amount)} to complete your purchase
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-accent">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Credit/Debit Card</span>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-accent">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span>Crypto Wallet</span>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-accent">
                <RadioGroupItem value="mobile" id="mobile" />
                <Label htmlFor="mobile" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile Payment</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paymentMethod === 'card' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input id="expiry" placeholder="MM/YY" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" placeholder="123" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input id="cardName" placeholder="John Doe" />
              </div>
            </div>
          )}

          {paymentMethod === 'wallet' && (
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Connect your wallet using the button in the navbar to pay with crypto.
              </p>
            </div>
          )}

          {paymentMethod === 'mobile' && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+1 234 567 8900" />
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <span className="font-semibold">Total Amount:</span>
            <span className="text-2xl font-bold">{formatCurrency(amount)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={processing}>
            {processing ? 'Processing...' : 'Pay Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

