'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/app/admin/layout'
import { formatDate } from '@/lib/utils'
import type { Profile, Project, ProjectStatus } from '@/lib/types'
import { PROJECT_STATUSES } from '@/lib/types'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'

interface ProjectWithClient extends Omit<Project, 'profiles'> {
  profiles?: { name: string; email: string }
}

const initialForm = {
  client_id: '',
  project_name: '',
  current_status: 'Discovery Call' as ProjectStatus,
  progress_percentage: 0,
  expected_launch_date: '',
  next_milestone: '',
}

export default function AdminProjectsPage() {
  const { profile } = useUser()
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [clients, setClients] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectWithClient | null>(null)
  const [formData, setFormData] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .select('*, profiles:client_id(name, email)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
    } else {
      setProjects((data as ProjectWithClient[]) ?? [])
    }
    setLoading(false)
  }, [])

  const fetchClients = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .order('name')
    setClients(data ?? [])
  }, [])

  useEffect(() => {
    fetchProjects()
    fetchClients()
  }, [fetchProjects, fetchClients])

  function openCreateModal() {
    setEditingProject(null)
    setFormData({
      ...initialForm,
      client_id: clients[0]?.id ?? '',
    })
    setMessage(null)
    setModalOpen(true)
  }

  function openEditModal(project: ProjectWithClient) {
    setEditingProject(project)
    setFormData({
      client_id: project.client_id,
      project_name: project.project_name,
      current_status: project.current_status,
      progress_percentage: project.progress_percentage,
      expected_launch_date: project.expected_launch_date ?? '',
      next_milestone: project.next_milestone ?? '',
    })
    setMessage(null)
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    const supabase = createClient()
    const payload = {
      client_id: formData.client_id,
      project_name: formData.project_name,
      current_status: formData.current_status,
      progress_percentage: formData.progress_percentage,
      expected_launch_date: formData.expected_launch_date || null,
      next_milestone: formData.next_milestone || null,
    }

    if (editingProject) {
      const { error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', editingProject.id)

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Project updated successfully' })
        fetchProjects()
        setTimeout(() => {
          setModalOpen(false)
          setMessage(null)
        }, 800)
      }
    } else {
      const { error } = await supabase.from('projects').insert(payload)

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Project created successfully' })
        fetchProjects()
        setTimeout(() => {
          setModalOpen(false)
          setMessage(null)
        }, 800)
      }
    }

    setSubmitting(false)
  }

  async function handleDelete(projectId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Error deleting project:', error)
    } else {
      fetchProjects()
    }
    setDeleteConfirm(null)
  }

  function getStatusVariant(status: string) {
    switch (status) {
      case 'Discovery Call':
        return 'default' as const
      case 'Content Collection':
        return 'info' as const
      case 'Wireframe':
        return 'info' as const
      case 'Development':
        return 'warning' as const
      case 'Testing':
        return 'warning' as const
      case 'Launch':
        return 'success' as const
      default:
        return 'default' as const
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all client projects
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
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
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-sm text-gray-500">No projects yet</p>
        </div>
      ) : (
        <Table
          headers={[
            'Project Name',
            'Client',
            'Status',
            'Progress',
            'Launch Date',
            'Actions',
          ]}
        >
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {project.project_name}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {project.profiles?.name ?? '—'}
              </td>
              <td className="px-6 py-4">
                <Badge variant={getStatusVariant(project.current_status)}>
                  {project.current_status}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 min-w-[120px]">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex-1">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${project.progress_percentage}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">
                    {project.progress_percentage}%
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {formatDate(project.expected_launch_date)}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(project)}
                  >
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
                    >
                      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirm(project.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
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
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Project"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete this project? This action cannot be
          undone and will remove all associated data.
        </p>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            Delete
          </Button>
        </div>
      </Modal>

      {/* Create/Edit Project Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setMessage(null)
        }}
        title={editingProject ? 'Edit Project' : 'New Project'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Client"
            value={formData.client_id}
            onChange={(e) =>
              setFormData((f) => ({ ...f, client_id: e.target.value }))
            }
            options={clients.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.email})`,
            }))}
            required
          />
          <Input
            label="Project Name"
            value={formData.project_name}
            onChange={(e) =>
              setFormData((f) => ({ ...f, project_name: e.target.value }))
            }
            required
            placeholder="My Awesome Project"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={formData.current_status}
              onChange={(e) =>
                setFormData((f) => ({
                  ...f,
                  current_status: e.target.value as ProjectStatus,
                }))
              }
              options={PROJECT_STATUSES.map((s) => ({
                value: s,
                label: s,
              }))}
            />
            <Input
              label="Progress (%)"
              type="number"
              min={0}
              max={100}
              value={formData.progress_percentage}
              onChange={(e) =>
                setFormData((f) => ({
                  ...f,
                  progress_percentage: parseInt(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expected Launch Date"
              type="date"
              value={formData.expected_launch_date}
              onChange={(e) =>
                setFormData((f) => ({
                  ...f,
                  expected_launch_date: e.target.value,
                }))
              }
            />
            <Input
              label="Next Milestone"
              value={formData.next_milestone}
              onChange={(e) =>
                setFormData((f) => ({
                  ...f,
                  next_milestone: e.target.value,
                }))
              }
              placeholder="e.g. Design review"
            />
          </div>

          {message && (
            <div
              className={`text-sm p-3 rounded-md ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setMessage(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? 'Saving...'
                : editingProject
                ? 'Update Project'
                : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
