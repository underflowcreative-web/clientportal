'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/app/dashboard/layout'
import { Project, ProjectStatus } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'

const statusVariant: Record<ProjectStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  'Discovery Call': 'info',
  'Content Collection': 'info',
  'Wireframe': 'warning',
  'Development': 'warning',
  'Testing': 'danger',
  'Launch': 'success',
}

export default function ProjectsPage() {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProjects(data as Project[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProjects()

    const supabase = createClient()
    const channel = supabase
      .channel('projects')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          fetchProjects()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track the progress of your active projects.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading projects...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
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
            className="text-gray-300 mx-auto mb-3"
          >
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
          </svg>
          <p className="text-gray-500">No projects yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {project.project_name}
                </h2>
                <Badge variant={statusVariant[project.current_status]}>
                  {project.current_status}
                </Badge>
              </div>

              <div className="mb-4">
                <ProgressBar value={project.progress_percentage} />
              </div>

              <div className="space-y-2 text-sm">
                {project.expected_launch_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Expected Launch</span>
                    <span className="text-gray-700 font-medium">
                      {formatDate(project.expected_launch_date)}
                    </span>
                  </div>
                )}
                {project.next_milestone && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Next Milestone</span>
                    <span className="text-gray-700 font-medium">
                      {project.next_milestone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
