'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { CheckCircle, XCircle, Camera } from 'lucide-react'

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
  onScanFailure?: (error: string) => void
}

export function QRScanner({ onScanSuccess, onScanFailure }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const scannerId = 'qr-scanner'

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode(scannerId)
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          setSuccess(true)
          setIsScanning(false)
          html5QrCode.stop()
          onScanSuccess(decodedText)
          setTimeout(() => setSuccess(false), 3000)
        },
        (errorMessage) => {
          // Ignore scan errors - they're common when no QR code is detected
        }
      )
      setIsScanning(true)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to start camera')
      setIsScanning(false)
      onScanFailure?.(err.message)
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

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>Point your camera at a QR code to scan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              QR code scanned successfully!
            </AlertDescription>
          </Alert>
        )}

        <div
          id={scannerId}
          className={isScanning ? 'w-full rounded-lg overflow-hidden' : 'hidden'}
        />

        {!isScanning && (
          <div className="flex justify-center items-center h-64 bg-muted rounded-lg">
            <div className="text-center space-y-4">
              <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Camera not active</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!isScanning ? (
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
  )
}

