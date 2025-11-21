'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { adminGetRoutes } from '@/lib/api'
import { useEffect, useState } from 'react'
import { Loader2, Train, Clock } from 'lucide-react'

export default function OperationsPage() {
  const [loading, setLoading] = useState(true)
  const [routes, setRoutes] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const data = await adminGetRoutes()
        setRoutes(data.filter((r) => r.active))
      } catch (error) {
        console.error('Error loading operations data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Station Operations</h1>
        <p className="text-muted-foreground">
          Overview of active trips and operations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Routes</CardTitle>
          <CardDescription>Currently operational routes</CardDescription>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <p className="text-muted-foreground">No active routes</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routes.map((route) => (
                <Card key={route.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Train className="h-5 w-5 text-primary" />
                      {route.origin} → {route.destination}
                    </CardTitle>
                    <CardDescription className="capitalize">
                      {route.vehicle_type}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {route.estimated_minutes && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{route.estimated_minutes} minutes</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Operations</CardTitle>
          <CardDescription>Live trip tracking and monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>Real-time operations data coming soon. This will show active trips, vehicle locations, and station status.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

