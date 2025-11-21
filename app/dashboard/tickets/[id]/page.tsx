'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getTicketById } from '@/lib/api'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { Loader2, ArrowLeft, Download, QrCode, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string
  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<any>(null)

  useEffect(() => {
    async function loadTicket() {
      try {
        const data = await getTicketById(ticketId)
        if (!data) {
          router.push('/dashboard/tickets')
          return
        }
        setTicket(data)
      } catch (error) {
        console.error('Error loading ticket:', error)
        router.push('/dashboard/tickets')
      } finally {
        setLoading(false)
      }
    }

    if (ticketId) {
      loadTicket()
    }
  }, [ticketId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!ticket) {
    return null
  }

  const statusColors: Record<string, string> = {
    valid: 'bg-green-500',
    active: 'bg-green-500',
    used: 'bg-gray-500',
    expired: 'bg-red-500',
  }

  const handleDownload = () => {
    // In a real app, generate PDF or image of ticket
    alert('Download ticket feature coming soon!')
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/tickets">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ticket Details</h1>
          <p className="text-muted-foreground">
            Ticket ID: {ticket.id.slice(0, 8)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code
            </CardTitle>
            <CardDescription>
              Show this QR code at the station for boarding
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                value={ticket.qr_payload || `railpay:ticket:${ticket.id}`}
                size={256}
                level="H"
              />
            </div>
            <Button onClick={handleDownload} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Ticket
            </Button>
          </CardContent>
        </Card>

        {/* Ticket Information */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle>Ticket Information</CardTitle>
              <Badge className={statusColors[ticket.status] || 'bg-gray-500'}>
                {ticket.status.toUpperCase()}
              </Badge>
            </div>
            <CardDescription>Ticket ID: {ticket.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticket.route && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Route</p>
                  <p className="text-lg font-semibold">
                    {ticket.route.origin} → {ticket.route.destination}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Type</p>
                  <p className="font-medium capitalize">{ticket.route.vehicle_type}</p>
                </div>

                {ticket.seat_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">Seat Number</p>
                    <p className="font-medium">{ticket.seat_number}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Ticket Type</p>
                  <p className="font-medium capitalize">{ticket.ticket_type}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(ticket.route.base_price)}
                  </p>
                </div>

                {ticket.route.estimated_minutes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Duration</p>
                    <p className="font-medium">{ticket.route.estimated_minutes} minutes</p>
                  </div>
                )}
              </>
            )}

            <div className="pt-4 border-t space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Purchased At</p>
                <p className="font-medium">
                  {formatDate(ticket.purchased_at)} at {formatTime(ticket.purchased_at)}
                </p>
              </div>

              {ticket.validated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Validated At</p>
                  <p className="font-medium">
                    {formatDate(ticket.validated_at)} at {formatTime(ticket.validated_at)}
                  </p>
                </div>
              )}

              {ticket.blockchain_tx_hash && (
                <div>
                  <p className="text-sm text-muted-foreground">Blockchain Transaction</p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${ticket.blockchain_tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    {ticket.blockchain_tx_hash.slice(0, 10)}...
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download Ticket
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link href={`/dashboard/tickets/${ticket.id}?show=qr`}>
                <QrCode className="h-4 w-4 mr-2" />
                Show for Scanning
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
