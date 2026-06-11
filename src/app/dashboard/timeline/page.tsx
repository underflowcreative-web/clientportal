'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/app/dashboard/layout'
import { Project, Milestone } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import Select from '@/components/ui/Select'
import ProgressBar from '@/components/ui/ProgressBar'

export default function TimelinePage() {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [milestonesLoading, setMilestonesLoading] = useState(false)

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

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

  const fetchMilestones = async (projectId: string) => {
    if (!projectId) return
    setMilestonesLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })

    if (data) {
      setMilestones(data as Milestone[])
    }
    setMilestonesLoading(false)
  }

  useEffect(() => {
    if (!selectedProjectId) return

    fetchMilestones(selectedProjectId)

    const supabase = createClient()
    const channel = supabase
      .channel('milestones')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'milestones' },
        () => {
          fetchMilestones(selectedProjectId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedProjectId])

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
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Timeline</h1>
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">No projects yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Timeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track milestones and project progress.
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

      {selectedProject && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">
              Overall Progress
            </h2>
            <span className="text-sm text-gray-500">
              {selectedProject.current_status}
            </span>
          </div>
          <ProgressBar value={selectedProject.progress_percentage} />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-medium text-gray-700 mb-6">Milestones</h2>

        {milestonesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : milestones.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No milestones added yet.
          </p>
        ) : (
          <div className="relative">
            {milestones.map((milestone, index) => {
              const isLast = index === milestones.length - 1

              return (
                <div key={milestone.id} className="flex gap-4">
                  {/* Timeline column */}
                  <div className="flex flex-col items-center">
                    {/* Circle */}
                    {milestone.completed ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white shrink-0" />
                    )}
                    {/* Line */}
                    {!isLast && (
                      <div className="w-0.5 flex-1 bg-gray-200 min-h-8" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
                    <p
                      className={`font-medium ${
                        milestone.completed
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }`}
                    >
                      {milestone.title}
                    </p>
                    {milestone.completed && milestone.completed_date && (
                      <p className="text-xs text-gray-400 mt-1">
                        Completed {formatDate(milestone.completed_date)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
