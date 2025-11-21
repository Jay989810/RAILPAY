'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { QRDisplay } from './QRDisplay'
import { Badge } from './ui/badge'
import { CheckCircle, Download, Ticket, MapPin, Clock, DollarSign, ArrowRight, X } from 'lucide-react'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import Link from 'next/link'

interface TicketQRCodeProps {
  ticket: {
    id: string
    route_id: string
    seat_number?: string | null
    ticket_type: string
    qr_payload: string
    status: string
    purchased_at: string
  }
  route?: {
    id: string
    origin: string
    destination: string
    base_price: number
    estimated_minutes?: number | null
  } | null
  onClose: () => void
}

export function TicketQRCode({ ticket, route, onClose }: TicketQRCodeProps) {
  const handleDownload = () => {
    // In real app, generate PDF or image of ticket
    alert('Download ticket feature coming soon!')
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Ticket Purchased Successfully!
          </DialogTitle>
          <DialogDescription>
            Your ticket has been created. Show this QR code at the station.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-center">Scan QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <QRDisplay value={ticket.qr_payload} />
              </div>
            </CardContent>
          </Card>

          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  Ticket Details
                </CardTitle>
                <Badge className={ticket.status === 'valid' ? 'bg-green-500' : ''}>
                  {ticket.status.toUpperCase()}
                </Badge>
              </div>
              <CardDescription>Ticket ID: {ticket.id.slice(0, 8)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {route && (
                <>
                  <div className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">{route.origin}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{route.destination}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    {ticket.seat_number && (
                      <div>
                        <p className="text-sm text-muted-foreground">Seat Number</p>
                        <p className="font-semibold">{ticket.seat_number}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Ticket Type</p>
                      <p className="font-semibold capitalize">{ticket.ticket_type}</p>
                    </div>
                    {route.estimated_minutes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-semibold">{route.estimated_minutes} minutes</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-semibold text-primary text-lg">
                        {formatCurrency(route.base_price)}
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Purchased: {formatDate(ticket.purchased_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download Ticket
            </Button>
            <Button asChild className="flex-1">
              <Link href={`/dashboard/tickets/${ticket.id}`}>
                View Ticket Details
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/dashboard/tickets">
                View All Tickets
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
