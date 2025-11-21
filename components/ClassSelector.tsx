'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export type TravelClass = 'standard' | 'business' | 'first'

interface ClassSelectorProps {
  selectedClass: TravelClass | ''
  onClassSelect: (classType: TravelClass) => void
  basePrice: number
}

interface ClassInfo {
  type: TravelClass
  name: string
  description: string
  multiplier: number
  features: string[]
  icon: string
}

const classInfo: Record<TravelClass, ClassInfo> = {
  standard: {
    type: 'standard',
    name: 'Standard Class',
    description: 'Comfortable seating with standard amenities',
    multiplier: 1.0,
    features: ['Standard seating', 'Air conditioning', 'Restroom access'],
    icon: '🚂',
  },
  business: {
    type: 'business',
    name: 'Business Class',
    description: 'Enhanced comfort with extra legroom and priority service',
    multiplier: 1.5,
    features: ['Extra legroom', 'Priority boarding', 'Complimentary refreshments', 'Wi-Fi access'],
    icon: '✨',
  },
  first: {
    type: 'first',
    name: 'First Class',
    description: 'Premium luxury experience with maximum comfort',
    multiplier: 2.5,
    features: ['Luxury seating', 'Premium meals', 'Personal service', 'Exclusive lounge access', 'Wi-Fi & Entertainment'],
    icon: '👑',
  },
}

export function ClassSelector({ selectedClass, onClassSelect, basePrice }: ClassSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Travel Class</h3>
        <p className="text-sm text-muted-foreground">
          Choose your preferred class of travel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.values(classInfo) as ClassInfo[]).map((classData) => {
          const isSelected = selectedClass === classData.type
          const price = basePrice * classData.multiplier

          return (
            <Card
              key={classData.type}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'ring-2 ring-primary border-primary'
              )}
              onClick={() => onClassSelect(classData.type)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{classData.icon}</span>
                      <CardTitle className="text-lg">{classData.name}</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      {classData.description}
                    </CardDescription>
                  </div>
                  {isSelected && (
                    <Badge className="bg-primary">
                      <Check className="h-3 w-3 mr-1" />
                      Selected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {classData.multiplier > 1 && (
                      <span>+{((classData.multiplier - 1) * 100).toFixed(0)}% from base</span>
                    )}
                    {classData.multiplier === 1 && <span>Base price</span>}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Features:</p>
                  <ul className="text-xs space-y-1">
                    {classData.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClassSelect(classData.type)
                  }}
                >
                  {isSelected ? 'Selected' : 'Select Class'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

