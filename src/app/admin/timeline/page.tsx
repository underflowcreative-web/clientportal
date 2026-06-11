'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/app/admin/layout'
import { formatDate } from '@/lib/utils'
import type { Project, Milestone } from '@/lib/types'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import ProgressBar from '@/components/ui/ProgressBar'

export default function AdminTimelinePage() {
  const { profile } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [milestonesLoading, setMilestonesLoading] = useState(false)
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const fetchProjects = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('project_name')
    setProjects(data ?? [])
    if (data && data.length > 0 && !selectedProjectId) {
      setSelectedProjectId(data[0].id)
    }
    setLoading(false)
  }, [selectedProjectId])

  const fetchMilestones = useCallback(async (projectId: string) => {
    if (!projectId) return
    setMilestonesLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order')
    setMilestones(data ?? [])
    setMilestonesLoading(false)
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find((p) => p.id === selectedProjectId) ?? null
      setSelectedProject(project)
      fetchMilestones(selectedProjectId)
    }
  }, [selectedProjectId, projects, fetchMilestones])

  async function handleProgressUpdate(newValue: number) {
    if (!selectedProjectId) return
    const supabase = createClient()
    const { error } = await supabase
      .from('projects')
      .update({ progress_percentage: newValue })
      .eq('id', selectedProjectId)

    if (!error) {
      setSelectedProject((prev) =>
        prev ? { ...prev, progress_percentage: newValue } : null
      )
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProjectId
            ? { ...p, progress_percentage: newValue }
            : p
        )
      )
    }
  }

  async function handleAddMilestone() {
    if (!newMilestoneTitle.trim() || !selectedProjectId) return
    const supabase = createClient()
    const maxOrder =
      milestones.length > 0
        ? Math.max(...milestones.map((m) => m.sort_order))
        : 0

    const { error } = await supabase.from('milestones').insert({
      project_id: selectedProjectId,
      title: newMilestoneTitle.trim(),
      completed: false,
      sort_order: maxOrder + 1,
    })

    if (!error) {
      setNewMilestoneTitle('')
      fetchMilestones(selectedProjectId)
    }
  }

  async function handleToggleComplete(milestone: Milestone) {
    const supabase = createClient()
    const newCompleted = !milestone.completed
    const { error } = await supabase
      .from('milestones')
      .update({
        completed: newCompleted,
        completed_date: newCompleted ? new Date().toISOString() : null,
      })
      .eq('id', milestone.id)

    if (!error) {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestone.id
            ? {
                ...m,
                completed: newCompleted,
                completed_date: newCompleted
                  ? new Date().toISOString()
                  : null,
              }
            : m
        )
      )
    }
  }

  async function handleDeleteMilestone(milestoneId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', milestoneId)

    if (!error) {
      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId))
    }
  }

  async function handleReorder(index: number, direction: 'up' | 'down') {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= milestones.length) return

    const current = milestones[index]
    const swap = milestones[swapIndex]

    const supabase = createClient()
    await Promise.all([
      supabase
        .from('milestones')
        .update({ sort_order: swap.sort_order })
        .eq('id', current.id),
      supabase
        .from('milestones')
        .update({ sort_order: current.sort_order })
        .eq('id', swap.id),
    ])

    fetchMilestones(selectedProjectId)
  }

  async function handleSaveTitle(milestoneId: string) {
    if (!editingTitle.trim()) return
    const supabase = createClient()
    const { error } = await supabase
      .from('milestones')
      .update({ title: editingTitle.trim() })
      .eq('id', milestoneId)

    if (!error) {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestoneId ? { ...m, title: editingTitle.trim() } : m
        )
      )
    }
    setEditingMilestoneId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Timeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage project progress and milestones
        </p>
      </div>

      {/* Project Selector */}
      <div className="max-w-md">
        <Select
          label="Select Project"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          options={projects.map((p) => ({
            value: p.id,
            label: p.project_name,
          }))}
        />
      </div>

      {selectedProject && (
        <>
          {/* Progress Bar */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3">
              Project Progress
            </h2>
            <ProgressBar
              value={selectedProject.progress_percentage}
              editable
              onEdit={handleProgressUpdate}
            />
          </div>

          {/* Milestones */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-medium text-gray-700">
                Milestones
              </h2>
            </div>

            {milestonesLoading ? (
              <div className="p-6 text-center text-sm text-gray-500">
                Loading milestones...
              </div>
            ) : milestones.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                No milestones yet. Add one below.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {milestones.map((milestone, index) => (
                  <li
                    key={milestone.id}
                    className="px-6 py-3 flex items-center gap-3 group hover:bg-gray-50"
                  >
                    {/* Reorder Arrows */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleReorder(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m18 15-6-6-6 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorder(index, 'down')}
                        disabled={index === milestones.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </div>

                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(milestone)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        milestone.completed
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {milestone.completed && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      {editingMilestoneId === milestone.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleSaveTitle(milestone.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter')
                              handleSaveTitle(milestone.id)
                            if (e.key === 'Escape')
                              setEditingMilestoneId(null)
                          }}
                          autoFocus
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMilestoneId(milestone.id)
                            setEditingTitle(milestone.title)
                          }}
                          className={`text-sm text-left truncate w-full ${
                            milestone.completed
                              ? 'text-gray-400 line-through'
                              : 'text-gray-900'
                          } hover:text-blue-600`}
                        >
                          {milestone.title}
                        </button>
                      )}
                      {milestone.completed && milestone.completed_date && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Completed {formatDate(milestone.completed_date)}
                        </p>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteMilestone(milestone.id)}
                      className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
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
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add Milestone */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddMilestone()
                  }}
                  placeholder="Add a new milestone..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button
                  onClick={handleAddMilestone}
                  disabled={!newMilestoneTitle.trim()}
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {projects.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">
            No projects available. Create a project first.
          </p>
        </div>
      )}
    </div>
  )
}
