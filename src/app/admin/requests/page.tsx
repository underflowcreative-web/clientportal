'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/app/admin/layout'
import { formatDate } from '@/lib/utils'
import type {
  ChangeRequest,
  Project,
  RequestStatus,
  Priority,
} from '@/lib/types'
import { REQUEST_STATUSES, PRIORITIES } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import Table from '@/components/ui/Table'
import Select from '@/components/ui/Select'

interface RequestWithJoins extends Omit<ChangeRequest, 'projects' | 'profiles'> {
  projects?: { project_name: string }
  profiles?: { name: string }
}

export default function AdminRequestsPage() {
  const { profile } = useUser()
  const [requests, setRequests] = useState<RequestWithJoins[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterProject, setFilterProject] = useState<string>('all')

  const fetchRequests = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('change_requests')
      .select(
        '*, projects(project_name), profiles:created_by(name)'
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching requests:', error)
    } else {
      setRequests((data as RequestWithJoins[]) ?? [])
    }
    setLoading(false)
  }, [])

  const fetchProjects = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('project_name')
    setProjects(data ?? [])
  }, [])

  useEffect(() => {
    fetchRequests()
    fetchProjects()
  }, [fetchRequests, fetchProjects])

  async function handleStatusChange(
    requestId: string,
    newStatus: RequestStatus
  ) {
    const supabase = createClient()
    const { error } = await supabase
      .from('change_requests')
      .update({ status: newStatus })
      .eq('id', requestId)

    if (!error) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: newStatus } : r
        )
      )
    }
  }

  function getPriorityVariant(priority: Priority) {
    switch (priority) {
      case 'Low':
        return 'default' as const
      case 'Medium':
        return 'warning' as const
      case 'High':
        return 'danger' as const
      default:
        return 'default' as const
    }
  }

  function getStatusVariant(status: RequestStatus) {
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

  const filteredRequests = requests.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    if (filterPriority !== 'all' && r.priority !== filterPriority) return false
    if (filterProject !== 'all' && r.project_id !== filterProject) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading requests...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Change Requests</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and manage client change requests
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="w-48">
          <Select
            label="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              ...REQUEST_STATUSES.map((s) => ({ value: s, label: s })),
            ]}
          />
        </div>
        <div className="w-48">
          <Select
            label="Priority"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            options={[
              { value: 'all', label: 'All Priorities' },
              ...PRIORITIES.map((p) => ({ value: p, label: p })),
            ]}
          />
        </div>
        <div className="w-48">
          <Select
            label="Project"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            options={[
              { value: 'all', label: 'All Projects' },
              ...projects.map((p) => ({
                value: p.id,
                label: p.project_name,
              })),
            ]}
          />
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto text-gray-300 mb-3"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p className="text-sm text-gray-500">No change requests found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Project</th>
                <th className="px-6 py-3">Submitted By</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <>
                  <tr
                    key={request.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      setExpandedId(
                        expandedId === request.id ? null : request.id
                      )
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`text-gray-400 transition-transform ${
                            expandedId === request.id ? 'rotate-90' : ''
                          }`}
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                        <span className="font-medium text-gray-900">
                          {request.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {request.projects?.project_name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {request.profiles?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getPriorityVariant(request.priority)}>
                        {request.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-36"
                      >
                        <select
                          value={request.status}
                          onChange={(e) =>
                            handleStatusChange(
                              request.id,
                              e.target.value as RequestStatus
                            )
                          }
                          className="w-full appearance-none px-2 py-1 pr-6 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {REQUEST_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                  {expandedId === request.id && (
                    <tr key={`${request.id}-expanded`}>
                      <td
                        colSpan={7}
                        className="px-6 py-4 bg-gray-50"
                      >
                        <div className="pl-7">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                            Description
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {request.description || 'No description provided.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
