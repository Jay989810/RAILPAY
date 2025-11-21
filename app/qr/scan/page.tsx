'use client'

import { QRScanner } from '@/components/QRScanner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Ticket } from 'lucide-react'
import { useState } from 'react'

export default function ScanQRPage() {
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(false)

  const handleScanSuccess = (decodedText: string) => {
    setScannedData(decodedText)
    // In real app, validate the ticket ID with backend
    setIsValid(true)
  }

  const handleScanFailure = (error: string) => {
    console.error('Scan error:', error)
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scan QR Code</h1>
        <p className="text-muted-foreground">
          Point your camera at a QR code to verify tickets
        </p>
      </div>

      <QRScanner onScanSuccess={handleScanSuccess} onScanFailure={handleScanFailure} />

      {scannedData && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Scan Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isValid ? (
              <Alert className="border-green-500 bg-green-50">
                <Ticket className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p className="font-semibold">Ticket Valid!</p>
                    <p>Ticket ID: {scannedData}</p>
                    <p className="text-sm">This ticket has been verified successfully.</p>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Scanned Data:</p>
                    <p className="font-mono text-sm break-all">{scannedData}</p>
                    <p className="text-sm text-muted-foreground">
                      Validating ticket...
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

