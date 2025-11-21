'use client'

import { AdminQRScanner } from '@/components/AdminQRScanner'

export default function AdminScanPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ticket Scanner</h1>
        <p className="text-muted-foreground">
          Scan ticket QR codes to validate and verify
        </p>
      </div>

      <AdminQRScanner />
    </div>
  )
}
