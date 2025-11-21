'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Train, ArrowRight, Calendar, Users } from 'lucide-react'

interface Route {
  id: string
  from: string
  to: string
  duration: string
  price: number
  availableSeats: number
}

const mockRoutes: Route[] = [
  {
    id: '1',
    from: 'New York',
    to: 'Boston',
    duration: '3h 30m',
    price: 89,
    availableSeats: 45,
  },
  {
    id: '2',
    from: 'New York',
    to: 'Philadelphia',
    duration: '1h 30m',
    price: 45,
    availableSeats: 120,
  },
  {
    id: '3',
    from: 'New York',
    to: 'Washington DC',
    duration: '3h 15m',
    price: 95,
    availableSeats: 78,
  },
]

interface RouteSelectorProps {
  onRouteSelect?: (routeId: string, price: number) => void
}

export function RouteSelector({ onRouteSelect }: RouteSelectorProps) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)

  const handleSearch = () => {
    // In real app, this would call the API
    const route = mockRoutes.find(r => r.from === from && r.to === to)
    setSelectedRoute(route || null)
  }

  const handleBookNow = () => {
    if (selectedRoute && onRouteSelect) {
      onRouteSelect(selectedRoute.id, selectedRoute.price)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Train className="h-5 w-5" />
          Search Routes
        </CardTitle>
        <CardDescription>Find and book your train journey</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger id="from">
                <SelectValue placeholder="Select origin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New York">New York</SelectItem>
                <SelectItem value="Boston">Boston</SelectItem>
                <SelectItem value="Philadelphia">Philadelphia</SelectItem>
                <SelectItem value="Washington DC">Washington DC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger id="to">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New York">New York</SelectItem>
                <SelectItem value="Boston">Boston</SelectItem>
                <SelectItem value="Philadelphia">Philadelphia</SelectItem>
                <SelectItem value="Washington DC">Washington DC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Travel Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Passengers</Label>
            <Select value={quantity} onValueChange={setQuantity}>
              <SelectTrigger id="quantity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'Passenger' : 'Passengers'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleSearch} className="w-full" size="lg">
          Search Routes
        </Button>

        {selectedRoute && (
          <Card className="mt-4 border-primary">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {selectedRoute.from}
                  <ArrowRight className="h-4 w-4" />
                  {selectedRoute.to}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{selectedRoute.duration}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Available Seats:
                </span>
                <span className="font-medium">{selectedRoute.availableSeats}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold pt-2 border-t">
                <span>Price per ticket:</span>
                <span>${selectedRoute.price}</span>
              </div>
              <Button className="w-full mt-4" onClick={handleBookNow}>Book Now</Button>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

