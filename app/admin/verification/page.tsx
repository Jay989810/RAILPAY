'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { formatDate } from '@/lib/utils'

interface VerificationRecord {
  id: string
  user_id: string
  nin: string | null
  request_payload: any
  response_payload: any
  success: boolean | null
  created_at: string
}

export default function AdminVerificationPage() {
  const [loading, setLoading] = useState(true)
  const [verifications, setVerifications] = useState<VerificationRecord[]>([])
  const [filteredVerifications, setFilteredVerifications] = useState<VerificationRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [profiles, setProfiles] = useState<Record<string, any>>({})

  useEffect(() => {
    async function fetchVerifications() {
      try {
        // Fetch all verification records
        const { data, error: fetchError } = await supabase
          .from('nin_verifications')
          .select('*')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        if (data) {
          setVerifications(data)
          setFilteredVerifications(data)

          // Fetch user profiles for display
          const userIds = Array.from(new Set(data.map((v: VerificationRecord) => v.user_id)))
          if (userIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', userIds)

            if (!profilesError && profilesData) {
              const profilesMap: Record<string, any> = {}
              profilesData.forEach((profile: any) => {
                profilesMap[profile.id] = profile
              })
              setProfiles(profilesMap)
            }
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load verifications')
      } finally {
        setLoading(false)
      }
    }

    fetchVerifications()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVerifications(verifications)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = verifications.filter((v) => {
      const profile = profiles[v.user_id]
      const fullName = profile?.full_name?.toLowerCase() || ''
      const email = profile?.email?.toLowerCase() || ''
      const nin = v.nin?.toLowerCase() || ''
      const userId = v.user_id.toLowerCase()

      return (
        nin.includes(query) ||
        fullName.includes(query) ||
        email.includes(query) ||
        userId.includes(query)
      )
    })

    setFilteredVerifications(filtered)
  }, [searchQuery, verifications, profiles])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">NIN Verification Dashboard</h1>
        <p className="text-muted-foreground">
          View all NIN verification attempts and their status
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Search Verifications</CardTitle>
          <CardDescription>Filter by NIN, name, email, or user ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search verifications..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification Records</CardTitle>
          <CardDescription>
            {filteredVerifications.length} of {verifications.length} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredVerifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No verification records found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">User</th>
                      <th className="text-left p-2 font-semibold">NIN</th>
                      <th className="text-left p-2 font-semibold">Status</th>
                      <th className="text-left p-2 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVerifications.map((verification) => {
                      const profile = profiles[verification.user_id]
                      return (
                        <tr key={verification.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div>
                              <p className="font-medium">
                                {profile?.full_name || 'Unknown User'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {profile?.email || verification.user_id.slice(0, 8)}
                              </p>
                            </div>
                          </td>
                          <td className="p-2 font-mono text-sm">
                            {verification.nin ? `*******${verification.nin.slice(-4)}` : 'N/A'}
                          </td>
                          <td className="p-2">
                            {verification.success === null ? (
                              <Badge variant="outline">Pending</Badge>
                            ) : verification.success ? (
                              <Badge className="bg-green-500 text-white">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Success
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </td>
                          <td className="p-2 text-sm text-muted-foreground">
                            {formatDate(verification.created_at)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
