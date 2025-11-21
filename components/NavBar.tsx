'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAuthStore } from '@/lib/store'
import { GlowButton } from './ui/glow-button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { LogOut, User, Train } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function NavBar() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      const { supabase } = await import('@/lib/supabase-client')
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
    logout()
    router.push('/auth/login')
  }

  return (
    <nav className="fixed top-0 z-50 w-full glass border-b border-electric-cyan/20 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xl font-bold text-foreground hover:text-electric-cyan transition-colors duration-300"
        >
          <Train className="h-6 w-6 text-electric-cyan" />
          <span className="text-glow-cyan">RailPay</span>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:block">
                <ConnectButton />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-10 w-10 rounded-full border-2 border-electric-cyan/30 hover:border-electric-cyan transition-all duration-300 hover:glow-border">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user?.name} alt={user?.name} />
                      <AvatarFallback className="bg-electric-cyan/20 text-electric-cyan font-semibold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-56 glass border-electric-cyan/20 backdrop-blur-xl" 
                  align="end" 
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-electric-cyan/20" />
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-electric-cyan/10 focus:bg-electric-cyan/10">
                    <Link href="/dashboard/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-electric-cyan/20" />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <GlowButton variant="ghost" asChild>
                <Link href="/auth/login">Login</Link>
              </GlowButton>
              <GlowButton asChild>
                <Link href="/auth/register">Sign Up</Link>
              </GlowButton>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

