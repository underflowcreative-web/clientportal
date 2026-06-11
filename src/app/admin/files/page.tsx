'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/app/admin/layout'
import { formatDate, formatFileSize, getFileTypeFromName } from '@/lib/utils'
import type { FileRecord, Project } from '@/lib/types'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'

interface FileWithJoins extends Omit<FileRecord, 'profiles'> {
  projects?: { project_name: string }
  profiles?: { name: string }
}

export default function AdminFilesPage() {
  const { profile } = useUser()
  const [files, setFiles] = useState<FileWithJoins[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProject, setFilterProject] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<FileWithJoins | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchFiles = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('files')
      .select(
        '*, projects(project_name), profiles:uploaded_by(name)'
      )
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error fetching files:', error)
    } else {
      setFiles((data as FileWithJoins[]) ?? [])
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
    fetchFiles()
    fetchProjects()
  }, [fetchFiles, fetchProjects])

  async function handleDownload(file: FileWithJoins) {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('project-files')
      .createSignedUrl(file.file_url, 3600)

    if (error) {
      console.error('Error generating signed URL:', error)
      return
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  async function handleDelete(file: FileWithJoins) {
    setDeleting(true)
    const supabase = createClient()

    // Remove from storage
    await supabase.storage.from('project-files').remove([file.file_url])

    // Delete DB record
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', file.id)

    if (error) {
      console.error('Error deleting file:', error)
    } else {
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
    }

    setDeleting(false)
    setDeleteConfirm(null)
  }

  const filteredFiles =
    filterProject === 'all'
      ? files
      : files.filter((f) => f.project_id === filterProject)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading files...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Files</h1>
          <p className="text-sm text-gray-500 mt-1">
            View all files across projects
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="max-w-xs">
        <Select
          label="Filter by Project"
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

      {filteredFiles.length === 0 ? (
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
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p className="text-sm text-gray-500">No files found</p>
        </div>
      ) : (
        <Table
          headers={[
            'File Name',
            'Project',
            'Uploaded By',
            'Type',
            'Size',
            'Date',
            'Actions',
          ]}
        >
          {filteredFiles.map((file) => (
            <tr key={file.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400 shrink-0"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                    {file.file_name}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {file.projects?.project_name ?? '—'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {file.profiles?.name ?? '—'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {file.file_type || getFileTypeFromName(file.file_name)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {formatFileSize(file.file_size)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {formatDate(file.uploaded_at)}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file)}
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
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirm(file)}
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
        title="Delete File"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{' '}
          <span className="font-medium">{deleteConfirm?.file_name}</span>?
          This will remove it from storage permanently.
        </p>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
