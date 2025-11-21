'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getOccupiedSeats } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SeatSelectorProps {
  coachName: string
  totalSeats: number
  routeId: string
  selectedSeat: string
  onSeatSelect: (seatNumber: string) => void
}

// Generate seat numbers for a coach (e.g., A1, A2, ..., A80)
function generateSeatNumbers(coachName: string, totalSeats: number): string[] {
  const coachLetter = coachName.replace('Coach ', '').charAt(0)
  const seats: string[] = []
  
  // Create seats in rows (assuming 4 seats per row, 20 rows = 80 seats)
  const seatsPerRow = 4
  const rows = Math.ceil(totalSeats / seatsPerRow)
  
  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= seatsPerRow; col++) {
      const seatNum = (row - 1) * seatsPerRow + col
      if (seatNum <= totalSeats) {
        seats.push(`${coachLetter}${seatNum}`)
      }
    }
  }
  
  return seats
}

export function SeatSelector({
  coachName,
  totalSeats,
  routeId,
  selectedSeat,
  onSeatSelect,
}: SeatSelectorProps) {
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOccupiedSeats() {
      try {
        setLoading(true)
        const occupied = await getOccupiedSeats(routeId, coachName)
        setOccupiedSeats(occupied)
      } catch (error) {
        console.error('Error loading occupied seats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (routeId && coachName) {
      loadOccupiedSeats()
    }
  }, [routeId, coachName])

  const seatNumbers = generateSeatNumbers(coachName, totalSeats)
  const seatsPerRow = 4

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Select Your Seat</Label>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-primary bg-primary/10" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-gray-400 bg-gray-400" />
            <span className="text-muted-foreground">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-primary bg-primary" />
            <span className="text-muted-foreground">Selected</span>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-muted/30">
          {/* Coach Layout */}
        <div className="space-y-2">
          {/* Aisle indicator */}
          <div className="text-center text-xs font-medium mb-3">
            <div className="text-sm font-semibold mb-1">{coachName}</div>
            <div className="text-muted-foreground">Window ← Aisle → Window</div>
          </div>

          {/* Seat grid */}
          <div className="space-y-1">
            {Array.from({ length: Math.ceil(seatNumbers.length / seatsPerRow) }).map((_, rowIndex) => {
              const rowSeats = seatNumbers.slice(
                rowIndex * seatsPerRow,
                (rowIndex + 1) * seatsPerRow
              )

              return (
                <div key={rowIndex} className="flex items-center gap-2">
                  {/* Left side (2 seats) */}
                  <div className="flex gap-1">
                    {rowSeats.slice(0, 2).map((seat) => {
                      const isOccupied = occupiedSeats.includes(seat)
                      const isSelected = selectedSeat === seat

                      return (
                        <Button
                          key={seat}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            'w-12 h-10 text-xs font-medium',
                            isOccupied && !isSelected && 'bg-gray-400 border-gray-500 text-white cursor-not-allowed opacity-60',
                            isSelected && 'bg-primary text-primary-foreground',
                            !isOccupied && !isSelected && 'hover:bg-primary/10'
                          )}
                          onClick={() => !isOccupied && onSeatSelect(seat)}
                          disabled={isOccupied}
                        >
                          {seat}
                        </Button>
                      )
                    })}
                  </div>

                  {/* Aisle gap */}
                  <div className="w-4" />

                  {/* Right side (2 seats) */}
                  <div className="flex gap-1">
                    {rowSeats.slice(2, 4).map((seat) => {
                      const isOccupied = occupiedSeats.includes(seat)
                      const isSelected = selectedSeat === seat

                      return (
                        <Button
                          key={seat}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            'w-12 h-10 text-xs font-medium',
                            isOccupied && !isSelected && 'bg-gray-400 border-gray-500 text-white cursor-not-allowed opacity-60',
                            isSelected && 'bg-primary text-primary-foreground',
                            !isOccupied && !isSelected && 'hover:bg-primary/10'
                          )}
                          onClick={() => !isOccupied && onSeatSelect(seat)}
                          disabled={isOccupied}
                        >
                          {seat}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Coach info */}
          <div className="text-center text-xs text-muted-foreground mt-4 pt-4 border-t">
            <p className="font-medium">Selected Seat: <span className="text-primary font-semibold">{selectedSeat || 'None'}</span></p>
            <p className="mt-1 text-xs">Click on an available seat to select it</p>
          </div>
        </div>
      </div>
    </div>
  )
}

