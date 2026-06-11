'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/app/dashboard/layout'
import { Project, ChangeRequest, Priority, RequestStatus } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

const priorityVariant: Record<Priority, 'default' | 'warning' | 'danger'> = {
  Low: 'default',
  Medium: 'warning',
  High: 'danger',
}

const statusVariant: Record<RequestStatus, 'warning' | 'info' | 'success'> = {
  Pending: 'warning',
  'In Progress': 'info',
  Completed: 'success',
}

export default function RequestsPage() {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [requests, setRequests] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjects = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        setProjects(data as Project[])
        setSelectedProjectId(data[0].id)
      }
      setLoading(false)
    }

    fetchProjects()
  }, [])

  const fetchRequests = async (projectId: string) => {
    if (!projectId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('change_requests')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (data) {
      setRequests(data as ChangeRequest[])
    }
  }

  useEffect(() => {
    if (!selectedProjectId) return

    fetchRequests(selectedProjectId)

    const supabase = createClient()
    const channel = supabase
      .channel('change_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'change_requests' },
        () => {
          fetchRequests(selectedProjectId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedProjectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !selectedProjectId) return

    setSubmitting(true)
    setSuccessMessage(null)

    const supabase = createClient()
    const { error } = await supabase.from('change_requests').insert({
      project_id: selectedProjectId,
      title: title.trim(),
      description: description.trim() || null,
      priority,
      created_by: user.id,
    })

    setSubmitting(false)

    if (!error) {
      setTitle('')
      setDescription('')
      setPriority('Medium')
      setSuccessMessage('Request submitted successfully.')
      fetchRequests(selectedProjectId)
      setTimeout(() => setSuccessMessage(null), 4000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">
          Change Requests
        </h1>
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">No projects yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Change Requests
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Submit and track change requests for your projects.
        </p>
      </div>

      <div className="max-w-xs mb-6">
        <Select
          label="Project"
          options={projects.map((p) => ({
            value: p.id,
            label: p.project_name,
          }))}
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        />
      </div>

      {/* Submit Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-sm font-medium text-gray-700 mb-4">
          Submit a Request
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            placeholder="Brief summary of the change..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            label="Description"
            placeholder="Describe the change in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="max-w-xs">
            <Select
              label="Priority"
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
              ]}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
            {successMessage && (
              <p className="text-sm text-emerald-600 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {successMessage}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Request List */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-4">
          Your Requests
        </h2>

        {requests.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500 text-sm">No requests submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{req.title}</p>
                    {req.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {req.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(req.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={priorityVariant[req.priority]}>
                      {req.priority}
                    </Badge>
                    <Badge variant={statusVariant[req.status]}>
                      {req.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
