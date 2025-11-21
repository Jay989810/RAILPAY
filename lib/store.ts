import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

interface Ticket {
  id: string
  routeName: string
  from: string
  to: string
  date: string
  time: string
  price: number
  status: 'active' | 'used' | 'expired'
  qrCode?: string
}

interface TicketState {
  tickets: Ticket[]
  selectedTicket: Ticket | null
  setTickets: (tickets: Ticket[]) => void
  addTicket: (ticket: Ticket) => void
  setSelectedTicket: (ticket: Ticket | null) => void
}

export const useTicketStore = create<TicketState>((set) => ({
  tickets: [],
  selectedTicket: null,
  setTickets: (tickets) => set({ tickets }),
  addTicket: (ticket) => set((state) => ({ tickets: [ticket, ...state.tickets] })),
  setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),
}))

