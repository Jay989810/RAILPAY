'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  adminGetRoutes,
  adminCreateRoute,
  adminUpdateRoute,
  adminDeleteRoute,
} from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Plus, Edit, Trash2, Power } from 'lucide-react'

export default function RoutesPage() {
  const [loading, setLoading] = useState(true)
  const [routes, setRoutes] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<any>(null)
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    vehicle_type: '',
    base_price: '',
    estimated_minutes: '',
    active: true,
  })

  useEffect(() => {
    loadRoutes()
  }, [])

  async function loadRoutes() {
    try {
      setLoading(true)
      const data = await adminGetRoutes()
      setRoutes(data)
    } catch (error) {
      console.error('Error loading routes:', error)
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingRoute(null)
    setFormData({
      origin: '',
      destination: '',
      vehicle_type: '',
      base_price: '',
      estimated_minutes: '',
      active: true,
    })
    setDialogOpen(true)
  }

  function openEditDialog(route: any) {
    setEditingRoute(route)
    setFormData({
      origin: route.origin,
      destination: route.destination,
      vehicle_type: route.vehicle_type,
      base_price: route.base_price.toString(),
      estimated_minutes: route.estimated_minutes?.toString() || '',
      active: route.active,
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const routeData = {
        origin: formData.origin,
        destination: formData.destination,
        vehicle_type: formData.vehicle_type,
        base_price: parseFloat(formData.base_price),
        estimated_minutes: formData.estimated_minutes
          ? parseInt(formData.estimated_minutes)
          : undefined,
        active: formData.active,
      }

      if (editingRoute) {
        await adminUpdateRoute(editingRoute.id, routeData)
      } else {
        await adminCreateRoute(routeData)
      }

      setDialogOpen(false)
      await loadRoutes()
    } catch (error) {
      console.error('Error saving route:', error)
      alert('Failed to save route')
    }
  }

  async function handleToggleActive(route: any) {
    try {
      await adminUpdateRoute(route.id, { active: !route.active })
      await loadRoutes()
    } catch (error) {
      console.error('Error toggling route:', error)
      alert('Failed to update route')
    }
  }

  async function handleDelete(routeId: string) {
    if (!confirm('Are you sure you want to delete this route?')) return

    try {
      await adminDeleteRoute(routeId)
      await loadRoutes()
    } catch (error) {
      console.error('Error deleting route:', error)
      alert('Failed to delete route')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Route Management</h1>
          <p className="text-muted-foreground">
            Manage routes and their configurations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Route
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRoute ? 'Edit Route' : 'Create New Route'}
              </DialogTitle>
              <DialogDescription>
                {editingRoute
                  ? 'Update route information'
                  : 'Add a new route to the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin *</Label>
                <Input
                  id="origin"
                  value={formData.origin}
                  onChange={(e) =>
                    setFormData({ ...formData, origin: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                <Input
                  id="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicle_type: e.target.value })
                  }
                  placeholder="e.g., Train, Bus"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_price">Base Price *</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData({ ...formData, base_price: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_minutes">Estimated Minutes</Label>
                <Input
                  id="estimated_minutes"
                  type="number"
                  value={formData.estimated_minutes}
                  onChange={(e) =>
                    setFormData({ ...formData, estimated_minutes: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Routes</CardTitle>
          <CardDescription>List of all routes in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <p className="text-muted-foreground">No routes found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origin</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Vehicle Type</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell className="font-medium">{route.origin}</TableCell>
                    <TableCell>{route.destination}</TableCell>
                    <TableCell className="capitalize">{route.vehicle_type}</TableCell>
                    <TableCell>{formatCurrency(route.base_price)}</TableCell>
                    <TableCell>
                      {route.estimated_minutes
                        ? `${route.estimated_minutes} min`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={route.active ? 'default' : 'secondary'}>
                        {route.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(route)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(route)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(route.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
