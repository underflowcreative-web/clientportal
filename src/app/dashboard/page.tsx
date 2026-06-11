'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/app/dashboard/layout'
import { formatCurrency } from '@/lib/utils'

interface DashboardStats {
  projectCount: number
  milestoneCount: number
  fileCount: number
  requestCount: number
  outstandingAmount: number
}

export default function DashboardPage() {
  const { profile } = useUser()
  const [stats, setStats] = useState<DashboardStats>({
    projectCount: 0,
    milestoneCount: 0,
    fileCount: 0,
    requestCount: 0,
    outstandingAmount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      const [projectsRes, milestonesRes, filesRes, requestsRes, invoicesRes] =
        await Promise.all([
          supabase
            .from('projects')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('milestones')
            .select('id', { count: 'exact', head: true })
            .eq('completed', false),
          supabase
            .from('files')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('change_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'Pending'),
          supabase
            .from('invoices')
            .select('amount, status')
            .neq('status', 'Paid'),
        ])

      const outstandingAmount =
        invoicesRes.data?.reduce((sum, inv) => sum + (inv.amount || 0), 0) ?? 0

      setStats({
        projectCount: projectsRes.count ?? 0,
        milestoneCount: milestonesRes.count ?? 0,
        fileCount: filesRes.count ?? 0,
        requestCount: requestsRes.count ?? 0,
        outstandingAmount,
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  const cards = [
    {
      href: '/dashboard/projects',
      title: 'Projects',
      stat: `${stats.projectCount} active projects`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500"
        >
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </svg>
      ),
      accent: true,
    },
    {
      href: '/dashboard/timeline',
      title: 'Timeline',
      stat: `${stats.milestoneCount} pending milestones`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      href: '/dashboard/files',
      title: 'Files',
      stat: `${stats.fileCount} files uploaded`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500"
        >
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="M12 12v9" />
          <path d="m16 16-4-4-4 4" />
        </svg>
      ),
    },
    {
      href: '/dashboard/requests',
      title: 'Requests',
      stat: `${stats.requestCount} pending requests`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      href: '/dashboard/invoices',
      title: 'Invoices',
      stat: `${formatCurrency(stats.outstandingAmount)} outstanding`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500"
        >
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="M10 9H8" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
        </svg>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {profile.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here&apos;s an overview of your projects and activity.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-150 cursor-pointer block ${
                card.accent ? 'border-l-4 border-l-blue-100' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {card.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{card.stat}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
