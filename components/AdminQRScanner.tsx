'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { CheckCircle, XCircle, Camera, Loader2, User, MapPin, Ticket } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { validateTicket } from '@/lib/supabase-edge-functions'
import { formatDate, formatTime } from '@/lib/utils'

interface AdminQRScannerProps {
  onValidationComplete?: (result: any) => void
}

export function AdminQRScanner({ onValidationComplete }: AdminQRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [ticketData, setTicketData] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [routeData, setRouteData] = useState<any>(null)
  const scannerId = 'admin-qr-scanner'

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode(scannerId)
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
        },
        async (decodedText) => {
          setIsScanning(false)
          html5QrCode.stop()
          await handleTicketValidation(decodedText)
        },
        (errorMessage) => {
          // Ignore scan errors - they're common when no QR code is detected
        }
      )
      setIsScanning(true)
      setError(null)
      setValidationResult(null)
      setTicketData(null)
      setUserData(null)
      setRouteData(null)
    } catch (err: any) {
      setError(err.message || 'Failed to start camera')
      setIsScanning(false)
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        await scannerRef.current.clear()
        scannerRef.current = null
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
    setIsScanning(false)
  }

  const handleTicketValidation = async (qrPayload: string) => {
    setValidating(true)
    setError(null)
    setValidationResult(null)
    setTicketData(null)
    setUserData(null)
    setRouteData(null)

    try {
      // Extract ticket ID from QR payload
      if (!qrPayload.startsWith('railpay:ticket:')) {
        throw new Error('Invalid QR code format')
      }

      const ticketId = qrPayload.replace('railpay:ticket:', '')

      // Validate ticket via Edge Function
      const result = await validateTicket(supabase, { qrPayload })

      if (result.success && result.data) {
        setValidationResult(result)

        // Fetch ticket details
        const { data: ticket, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single()

        if (!ticketError && ticket) {
          setTicketData(ticket)

          // Fetch user details
          if (ticket.user_id) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('full_name, photo_url, email')
              .eq('id', ticket.user_id)
              .single()

            if (!profileError && profile) {
              setUserData(profile)
            }

            // Fetch route details
            if (ticket.route_id) {
              const { data: route, error: routeError } = await supabase
                .from('routes')
                .select('*')
                .eq('id', ticket.route_id)
                .single()

              if (!routeError && route) {
                setRouteData(route)
              }
            }
          }
        }

        onValidationComplete?.(result)
      } else {
        setError(result.message || 'Ticket validation failed')
        setValidationResult({ success: false, message: result.message })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate ticket')
      setValidationResult({ success: false, message: err.message })
    } finally {
      setValidating(false)
    }
  }

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Admin QR Scanner
          </CardTitle>
          <CardDescription>Scan ticket QR codes to validate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div
            id={scannerId}
            className={isScanning ? 'w-full rounded-lg overflow-hidden' : 'hidden'}
          />

          {!isScanning && !validating && (
            <div className="flex justify-center items-center h-64 bg-muted rounded-lg">
              <div className="text-center space-y-4">
                <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Camera not active</p>
              </div>
            </div>
          )}

          {validating && (
            <div className="flex justify-center items-center h-64 bg-muted rounded-lg">
              <div className="text-center space-y-4">
                <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
                <p className="text-muted-foreground">Validating ticket...</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {!isScanning && !validating ? (
              <Button onClick={startScanning} className="flex-1" size="lg">
                <Camera className="h-4 w-4 mr-2" />
                Start Scanning
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="destructive" className="flex-1" size="lg">
                Stop Scanning
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Result */}
      {validationResult && (
        <Card className={validationResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {validationResult.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-800">Ticket Valid</CardTitle>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-800">Ticket Invalid</CardTitle>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {validationResult.success && ticketData && (
              <>
                {userData && (
                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={userData.photo_url || undefined} />
                      <AvatarFallback>
                        {userData.full_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{userData.full_name}</p>
                      <p className="text-sm text-muted-foreground">{userData.email}</p>
                    </div>
                  </div>
                )}

                {routeData && (
                  <div className="p-4 bg-white rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{routeData.origin}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-semibold">{routeData.destination}</span>
                    </div>
                    {ticketData.seat_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                        <span>Seat: {ticketData.seat_number}</span>
                        <span>•</span>
                        <span className="capitalize">{ticketData.ticket_type}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 bg-white rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ticket ID:</span>
                    <span className="font-mono">{ticketData.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={ticketData.status === 'used' ? 'bg-gray-500' : 'bg-green-500'}>
                      {ticketData.status.toUpperCase()}
                    </Badge>
                  </div>
                  {ticketData.validated_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Validated:</span>
                      <span>{formatDate(ticketData.validated_at)}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {!validationResult.success && (
              <p className="text-red-800">{validationResult.message || 'Ticket validation failed'}</p>
            )}

            <Button
              onClick={() => {
                setValidationResult(null)
                setTicketData(null)
                setUserData(null)
                setRouteData(null)
                startScanning()
              }}
              className="w-full"
            >
              Scan Another Ticket
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

