'use client'

import { useSearchParams } from 'next/navigation'
import { QRDisplay } from '@/components/QRDisplay'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QrCode, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GenerateQRPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const ticketId = searchParams.get('id')
  const [customValue, setCustomValue] = useState(ticketId || '')
  const [qrValue, setQrValue] = useState(ticketId || '')

  const handleGenerate = () => {
    if (customValue.trim()) {
      setQrValue(customValue.trim())
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate QR Code</h1>
          <p className="text-muted-foreground">
            Create QR codes for tickets or custom content
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Generator
            </CardTitle>
            <CardDescription>
              Enter text or ticket ID to generate QR code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qr-input">Enter value</Label>
              <Input
                id="qr-input"
                placeholder="Ticket ID or custom text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
              />
            </div>
            <Button onClick={handleGenerate} className="w-full">
              Generate QR Code
            </Button>
          </CardContent>
        </Card>

        <div>
          {qrValue ? (
            <QRDisplay
              value={qrValue}
              title="Your QR Code"
              description="Use this QR code for scanning or sharing"
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                  <QrCode className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Enter a value above to generate QR code
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

