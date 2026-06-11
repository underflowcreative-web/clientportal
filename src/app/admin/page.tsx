'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/app/admin/layout'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { ChangeRequest } from '@/lib/types'
import Badge from '@/components/ui/Badge'

interface Stats {
  totalClients: number
  activeProjects: number
  pendingRequests: number
  outstandingInvoices: number
}

interface RecentRequest extends Omit<ChangeRequest, 'projects' | 'profiles'> {
  projects?: { project_name: string }
  profiles?: { name: string }
}

export default function AdminDashboard() {
  const { profile } = useUser()
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    activeProjects: 0,
    pendingRequests: 0,
    outstandingInvoices: 0,
  })
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function fetchDashboardData() {
      try {
        const [clientsRes, projectsRes, requestsRes, invoicesRes, recentRes] =
          await Promise.all([
            supabase
              .from('profiles')
              .select('id', { count: 'exact', head: true })
              .eq('role', 'client'),
            supabase
              .from('projects')
              .select('id', { count: 'exact', head: true }),
            supabase
              .from('change_requests')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'Pending'),
            supabase
              .from('invoices')
              .select('amount')
              .neq('status', 'Paid'),
            supabase
              .from('change_requests')
              .select(
                '*, projects(project_name), profiles:created_by(name)'
              )
              .order('created_at', { ascending: false })
              .limit(5),
          ])

        const outstandingTotal =
          invoicesRes.data?.reduce(
            (sum: number, inv: { amount: number }) => sum + inv.amount,
            0
          ) ?? 0

        setStats({
          totalClients: clientsRes.count ?? 0,
          activeProjects: projectsRes.count ?? 0,
          pendingRequests: requestsRes.count ?? 0,
          outstandingInvoices: outstandingTotal,
        })

        setRecentRequests((recentRes.data as RecentRequest[]) ?? [])
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statCards = [
    {
      label: 'Total Clients',
      value: stats.totalClients,
      format: (v: number) => String(v),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: 'Active Projects',
      value: stats.activeProjects,
      format: (v: number) => String(v),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: 'Pending Requests',
      value: stats.pendingRequests,
      format: (v: number) => String(v),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: 'Outstanding Invoices',
      value: stats.outstandingInvoices,
      format: (v: number) => formatCurrency(v),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ]

  function getStatusVariant(status: string) {
    switch (status) {
      case 'Pending':
        return 'warning' as const
      case 'In Progress':
        return 'info' as const
      case 'Completed':
        return 'success' as const
      default:
        return 'default' as const
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back{profile?.name ? `, ${profile.name}` : ''}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-lg p-6 relative"
          >
            <div className="absolute top-4 right-4">{card.icon}</div>
            <p className="text-3xl font-bold text-gray-900">
              {card.format(card.value)}
            </p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {recentRequests.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              No recent change requests
            </div>
          ) : (
            recentRequests.map((request) => (
              <div
                key={request.id}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {request.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {request.projects?.project_name ?? 'Unknown project'}
                    {request.profiles?.name
                      ? ` · by ${request.profiles.name}`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={getStatusVariant(request.status)}>
                    {request.status}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {formatDate(request.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
