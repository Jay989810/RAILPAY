'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { adminGetUsers, adminGetTickets, adminGetPasses } from '@/lib/api'
import { Loader2, User, Search, Mail, Phone, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function UsersPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [userTickets, setUserTickets] = useState<any[]>([])
  const [userPasses, setUserPasses] = useState<any[]>([])

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.full_name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.phone?.toLowerCase().includes(query) ||
            user.nin_number?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, users])

  async function loadUsers() {
    try {
      setLoading(true)
      const data = await adminGetUsers()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  async function viewUserDetails(user: any) {
    setSelectedUser(user)
    setDialogOpen(true)

    // Load user's tickets and passes
    try {
      const [allTickets, allPasses] = await Promise.all([
        adminGetTickets(),
        adminGetPasses(),
      ])

      const userTicketsData = allTickets.filter((t) => t.user_id === user.id)
      const userPassesData = allPasses.filter((p) => p.user_id === user.id)

      setUserTickets(userTicketsData)
      setUserPasses(userPassesData)
    } catch (error) {
      console.error('Error loading user details:', error)
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View and manage all user profiles
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No users found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>NIN Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photo_url || undefined} />
                          <AvatarFallback>
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.full_name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email || 'N/A'}</TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell>
                      {user.nin_verified ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Verified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role || 'user'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewUserDetails(user)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Profile Details</DialogTitle>
            <DialogDescription>
              Complete information about this user
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={selectedUser.photo_url || undefined} />
                      <AvatarFallback className="text-2xl">
                        {selectedUser.full_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{selectedUser.full_name || 'N/A'}</CardTitle>
                      <CardDescription>{selectedUser.email || 'N/A'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </p>
                      <p className="font-medium">{selectedUser.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </p>
                      <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">NIN Number</p>
                      <p className="font-medium">{selectedUser.nin_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">NIN Status</p>
                      {selectedUser.nin_verified ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Verified
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}>
                        {selectedUser.role || 'user'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Joined
                      </p>
                      <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Tickets */}
              <Card>
                <CardHeader>
                  <CardTitle>Tickets ({userTickets.length})</CardTitle>
                  <CardDescription>All tickets purchased by this user</CardDescription>
                </CardHeader>
                <CardContent>
                  {userTickets.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No tickets found</p>
                  ) : (
                    <div className="space-y-2">
                      {userTickets.slice(0, 10).map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {ticket.route?.origin} → {ticket.route?.destination}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(ticket.purchased_at)} • {ticket.ticket_type}
                            </p>
                          </div>
                          <Badge
                            variant={ticket.status === 'used' ? 'secondary' : 'default'}
                            className={ticket.status === 'active' ? 'bg-green-500' : ''}
                          >
                            {ticket.status}
                          </Badge>
                        </div>
                      ))}
                      {userTickets.length > 10 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          Showing 10 of {userTickets.length} tickets
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Passes */}
              <Card>
                <CardHeader>
                  <CardTitle>Passes ({userPasses.length})</CardTitle>
                  <CardDescription>All passes purchased by this user</CardDescription>
                </CardHeader>
                <CardContent>
                  {userPasses.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No passes found</p>
                  ) : (
                    <div className="space-y-2">
                      {userPasses.slice(0, 10).map((pass) => (
                        <div
                          key={pass.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium capitalize">{pass.pass_type} Pass</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(pass.starts_at)} - {formatDate(pass.expires_at)}
                            </p>
                          </div>
                          <Badge
                            variant={pass.status === 'expired' ? 'secondary' : 'default'}
                            className={pass.status === 'active' ? 'bg-green-500' : ''}
                          >
                            {pass.status}
                          </Badge>
                        </div>
                      ))}
                      {userPasses.length > 10 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          Showing 10 of {userPasses.length} passes
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

