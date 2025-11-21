/**
 * Frontend API Helpers
 * 
 * This file provides TypeScript helper functions for interacting with Supabase
 * from the Next.js frontend application. All functions use the Supabase client
 * for authentication and data operations.
 */

import { supabase } from './supabase-client'
import {
  buyTicket as edgeBuyTicket,
  createPass as edgeCreatePass,
  checkPassStatus as edgeCheckPassStatus,
  fetchRoutes as edgeFetchRoutes,
  fetchVehicles as edgeFetchVehicles,
  getDigitalIdCard as edgeGetDigitalIdCard,
  type BuyTicketParams,
  type CreatePassParams,
  type CheckPassStatusParams,
} from './supabase-edge-functions'
import type { Database } from './supabase-client'

// Type definitions
type Profile = Database['public']['Tables']['profiles']['Row']
type Ticket = Database['public']['Tables']['tickets']['Row']
type Route = Database['public']['Tables']['routes']['Row']

export interface TicketWithRoute extends Ticket {
  route?: Route | null
}

export interface Pass {
  id: string
  user_id: string
  pass_type: 'daily' | 'weekly' | 'monthly'
  starts_at: string
  expires_at: string
  status: string
  blockchain_tx_hash: string | null
  blockchain_pass_id: number | null
  created_at: string
}

export interface AdminStats {
  totalTickets: number
  totalRevenue: number
  activePasses: number
  activeRoutes: number
}

export interface RevenueStats {
  total: number
  byTicket: number
  byPass: number
  recentPayments: Array<{
    id: string
    amount: number
    currency: string
    payment_method: string
    created_at: string
  }>
}

export interface Staff {
  id: string
  user_id: string
  station: string | null
  role: string
  created_at: string
}

export interface Device {
  id: string
  device_id: string
  station: string | null
  status: string
  last_online: string | null
  created_at: string
}

/**
 * Get user profile
 */
export async function getProfile(): Promise<Profile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

/**
 * Get all tickets for the current user
 */
export async function getUserTickets(): Promise<TicketWithRoute[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false })

    if (ticketsError) throw ticketsError

    // Fetch routes for each ticket
    const ticketsWithRoutes: TicketWithRoute[] = await Promise.all(
      (tickets || []).map(async (ticket) => {
        if (!ticket.route_id) return { ...ticket, route: null }

        const { data: route } = await supabase
          .from('routes')
          .select('*')
          .eq('id', ticket.route_id)
          .single()

        return { ...ticket, route: route || null }
      })
    )

    return ticketsWithRoutes
  } catch (error) {
    console.error('Error fetching user tickets:', error)
    return []
  }
}

/**
 * Get a single ticket by ID
 */
export async function getTicketById(id: string): Promise<TicketWithRoute | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (ticketError) throw ticketError
    if (!ticket) return null

    // Fetch route
    let route = null
    if (ticket.route_id) {
      const { data: routeData } = await supabase
        .from('routes')
        .select('*')
        .eq('id', ticket.route_id)
        .single()
      route = routeData
    }

    return { ...ticket, route }
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return null
  }
}

/**
 * Get all passes for the current user
 */
export async function getPasses(): Promise<Pass[]> {
  try {
    const result = await edgeCheckPassStatus(supabase)
    if (!result.success || !result.data) return []

    // Handle both single pass and array of passes
    const passes = Array.isArray(result.data) ? result.data : [result.data]
    return passes as Pass[]
  } catch (error) {
    console.error('Error fetching passes:', error)
    return []
  }
}

/**
 * Get active pass for the current user
 */
export async function getActivePass(): Promise<Pass | null> {
  try {
    const passes = await getPasses()
    const now = new Date().toISOString()
    
    return passes.find(
      (pass) => pass.status === 'active' && pass.expires_at > now
    ) || null
  } catch (error) {
    console.error('Error fetching active pass:', error)
    return null
  }
}

/**
 * Get all active routes
 */
export async function getRoutes(): Promise<Route[]> {
  try {
    // Try direct Supabase query first (faster)
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('active', true)
      .order('origin', { ascending: true })

    if (!error && data) {
      return data
    }

    // Fallback to edge function if direct query fails
    const result = await edgeFetchRoutes(supabase, { includeInactive: false })
    if (!result.success || !result.data) return []
    return result.data
  } catch (error) {
    console.error('Error fetching routes:', error)
    return []
  }
}

/**
 * Get all vehicles
 */
export async function getVehicles() {
  try {
    // Try direct Supabase query first (faster)
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('active', true)
      .eq('vehicle_type', 'train')
      .order('vehicle_name', { ascending: true })

    if (!error && data) {
      return data
    }

    // Fallback to edge function if direct query fails
    const result = await edgeFetchVehicles(supabase)
    if (!result.success || !result.data) return []
    return result.data
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return []
  }
}

/**
 * Get occupied seats for a specific route and coach
 */
export async function getOccupiedSeats(routeId: string, coachName?: string): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Build query to get tickets with seat numbers for this route
    let query = supabase
      .from('tickets')
      .select('seat_number')
      .eq('route_id', routeId)
      .in('status', ['valid', 'active'])
      .not('seat_number', 'is', null)

    // If coach name is provided, filter seats by coach (assuming seat format is like "A12", "B5")
    if (coachName) {
      const coachLetter = coachName.replace('Coach ', '').charAt(0)
      query = query.like('seat_number', `${coachLetter}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching occupied seats:', error)
      return []
    }

    // Return array of occupied seat numbers
    return (data || []).map((ticket) => ticket.seat_number).filter(Boolean) as string[]
  } catch (error) {
    console.error('Error fetching occupied seats:', error)
    return []
  }
}

/**
 * Buy a ticket
 */
export async function buyTicket(payload: BuyTicketParams) {
  try {
    console.log('buyTicket called with payload:', payload)
    const result = await edgeBuyTicket(supabase, payload)
    console.log('buyTicket result:', result)
    
    // Return the result as-is - error handling is done in edgeBuyTicket
    return result
  } catch (error) {
    console.error('Error buying ticket (api.ts):', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to buy ticket'
    
    // Provide user-friendly error messages
    if (errorMessage.includes('Failed to send') || 
        errorMessage.includes('fetch') || 
        errorMessage.includes('network') ||
        errorMessage.includes('ECONNREFUSED')) {
      return {
        success: false,
        message: 'Unable to connect to the server. Please check your internet connection and ensure the edge function is deployed.',
      }
    }
    
    return {
      success: false,
      message: errorMessage,
    }
  }
}

/**
 * Create a pass
 */
export async function createPass(passType: 'daily' | 'weekly' | 'monthly') {
  try {
    const result = await edgeCreatePass(supabase, { passType })
    
    // If edge function fails, provide a more helpful error message
    if (!result.success) {
      const errorMsg = result.message || 'Failed to create pass'
      // Check if it's a network/connection error
      if (errorMsg.includes('Failed to send') || errorMsg.includes('fetch')) {
        return {
          success: false,
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
        }
      }
      return result
    }
    
    return result
  } catch (error) {
    console.error('Error creating pass:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create pass'
    
    // Provide user-friendly error messages
    if (errorMessage.includes('Failed to send') || errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return {
        success: false,
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
      }
    }
    
    return {
      success: false,
      message: errorMessage,
    }
  }
}

/**
 * Get digital ID card data
 */
export async function getDigitalIdCard() {
  try {
    return await edgeGetDigitalIdCard(supabase)
  } catch (error) {
    console.error('Error fetching digital ID card:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch ID card',
    }
  }
}

// ==================== ADMIN FUNCTIONS ====================

/**
 * Check if current user is admin
 */
async function checkIsAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Check if user is admin via profile role or staff table
    if (profile?.role === 'admin') return true

    const { data: staff } = await supabase
      .from('staff')
      .select('id')
      .eq('user_id', user.id)
      .single()

    return !!staff
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Get admin statistics
 */
export async function adminGetStats(): Promise<AdminStats | null> {
  try {
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    // Get total tickets
    const { count: totalTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })

    // Get total revenue from payments
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')

    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // Get active passes count
    const now = new Date().toISOString()
    const { count: activePasses } = await supabase
      .from('passes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gt('expires_at', now)

    // Get active routes count
    const { count: activeRoutes } = await supabase
      .from('routes')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)

    return {
      totalTickets: totalTickets || 0,
      totalRevenue,
      activePasses: activePasses || 0,
      activeRoutes: activeRoutes || 0,
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return null
  }
}

/**
 * Get all routes (admin)
 */
export async function adminGetRoutes(): Promise<Route[]> {
  try {
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching routes:', error)
    return []
  }
}

/**
 * Create a new route (admin)
 */
export async function adminCreateRoute(routeData: {
  origin: string
  destination: string
  vehicle_type: string
  base_price: number
  estimated_minutes?: number
  active?: boolean
}): Promise<Route | null> {
  try {
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    const { data, error } = await supabase
      .from('routes')
      .insert({
        ...routeData,
        active: routeData.active ?? true,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating route:', error)
    return null
  }
}

/**
 * Update a route (admin)
 */
export async function adminUpdateRoute(
  id: string,
  updates: Partial<{
    origin: string
    destination: string
    vehicle_type: string
    base_price: number
    estimated_minutes: number
    active: boolean
  }>
): Promise<Route | null> {
  try {
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    const { data, error } = await supabase
      .from('routes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating route:', error)
    return null
  }
}

/**
 * Delete a route (admin)
 */
export async function adminDeleteRoute(id: string): Promise<boolean> {
  try {
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting route:', error)
    return false
  }
}

/**
 * Get revenue statistics (admin)
 */
export async function adminGetRevenueStats(): Promise<RevenueStats | null> {
  try {
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const total = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    const byTicket = payments?.filter(p => p.ticket_id).reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    const byPass = payments?.filter(p => p.pass_id).reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    const recentPayments = (payments || []).map(p => ({
      id: p.id,
      amount: p.amount || 0,
      currency: p.currency || 'ETH',
      payment_method: p.payment_method || 'unknown',
      created_at: p.created_at,
    }))

    return {
      total,
      byTicket,
      byPass,
      recentPayments,
    }
  } catch (error) {
    console.error('Error fetching revenue stats:', error)
    return null
  }
}

/**
 * Get all staff (admin)
 */
export async function adminGetStaff(): Promise<Staff[]> {
  try {
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching staff:', error)
    return []
  }
}

/**
 * Get all devices (admin)
 */
export async function adminGetDevices(): Promise<Device[]> {
  try {
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching devices:', error)
    return []
  }
}

/**
 * Get all payments (admin)
 */
export async function adminGetPayments() {
  try {
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) throw new Error('Unauthorized: Admin access required')

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching payments:', error)
    return []
  }
}
