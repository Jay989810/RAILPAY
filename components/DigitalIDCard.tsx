'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Download, CheckCircle, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { walletUtils } from '@/lib/wallet'

interface DigitalIDCardProps {
  userId: string
  fullName: string
  photoUrl?: string | null
  nin?: string | null
  walletAddress?: string | null
  ninVerifiedAt?: string | null
  ninVerified?: boolean
}

export function DigitalIDCard({
  userId,
  fullName,
  photoUrl,
  nin,
  walletAddress,
  ninVerifiedAt,
  ninVerified = false,
}: DigitalIDCardProps) {
  // Mask NIN: show only last 4 digits
  const maskedNin = nin ? `**** **** ${nin.slice(-4)}` : 'Not provided'
  const isVerified = ninVerified || !!ninVerifiedAt

  // Generate QR code payload for user
  const qrPayload = `railpay:user:${userId}`

  const handleDownload = () => {
    // Create a canvas to render the ID card for download
    const card = document.getElementById('digital-id-card')
    if (!card) return

    // In a real implementation, you would use html2canvas or similar
    alert('Download feature coming soon!')
  }

  return (
    <div className="space-y-6">
      <Card id="digital-id-card" className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-2 border-primary/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <CardContent className="relative p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left side - Photo and QR */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-primary/20">
                  <AvatarImage src={photoUrl || undefined} alt={fullName} />
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {ninVerifiedAt && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-background">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
              <div className="bg-white p-2 rounded-lg w-32">
                <QRCodeSVG value={qrPayload} size={120} level="H" />
              </div>
            </div>

            {/* Right side - Details */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">{fullName}</h2>
                <Badge className={isVerified ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {isVerified ? 'IDENTITY VERIFIED' : 'PENDING VERIFICATION'}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="border-b pb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">NIN</p>
                  <p className="text-lg font-mono font-semibold">{maskedNin}</p>
                </div>

                {walletAddress && (
                  <div className="border-b pb-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Wallet Address</p>
                    <p className="text-sm font-mono break-all">{walletUtils.formatAddress(walletAddress)}</p>
                  </div>
                )}

                {ninVerifiedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Verified</p>
                    <p className="text-sm">
                      {new Date(ninVerifiedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <QrCode className="h-4 w-4" />
                  <span>Scan QR code to verify identity</span>
                </div>
              </div>
            </div>
          </div>

          {/* Watermark */}
          <div className="absolute top-4 right-4 text-primary/10 font-bold text-4xl transform rotate-12">
            RailPay
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button onClick={handleDownload} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download ID Card
        </Button>
      </div>
    </div>
  )
}
