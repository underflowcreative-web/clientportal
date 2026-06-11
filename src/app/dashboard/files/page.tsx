'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/app/dashboard/layout'
import { Project, FileRecord } from '@/lib/types'
import { formatDate, formatFileSize, getFileTypeFromName } from '@/lib/utils'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import FileUploader from '@/components/ui/FileUploader'

function FileTypeIcon({ type }: { type: string | null }) {
  const t = type ?? 'File'

  if (t === 'Image') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    )
  }

  if (t === 'PDF' || t === 'Document') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M10 9H8" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
      </svg>
    )
  }

  if (t === 'Video') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
        <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
        <rect x="2" y="6" width="14" height="12" rx="2" />
      </svg>
    )
  }

  if (t === 'Design') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
        <path d="m2 13 5.5-5.5a2.12 2.12 0 0 1 3 3L5 16" />
        <path d="m9.5 7.5 3-3a2.12 2.12 0 0 1 3 3l-3 3" />
        <path d="m14 12 5.5-5.5a2.12 2.12 0 0 1 3 3L17 15" />
        <line x1="2" x2="22" y1="22" y2="22" />
      </svg>
    )
  }

  if (t === 'Archive') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
        <rect width="20" height="5" x="2" y="3" rx="1" />
        <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
        <path d="M10 12h4" />
      </svg>
    )
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  )
}

export default function FilesPage() {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)

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

  const fetchFiles = async (projectId: string) => {
    if (!projectId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('files')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false })

    if (data) {
      setFiles(data as FileRecord[])
    }
  }

  useEffect(() => {
    if (!selectedProjectId) return
    fetchFiles(selectedProjectId)
  }, [selectedProjectId])

  const handleUpload = async (uploadedFiles: File[]) => {
    if (!selectedProjectId) return
    setUploading(true)
    setUploadMessage(null)

    const supabase = createClient()
    let successCount = 0

    for (const file of uploadedFiles) {
      const { data, error } = await supabase.storage
        .from('project-files')
        .upload(`${selectedProjectId}/${file.name}`, file)

      if (error) {
        console.error('Upload error:', error)
        continue
      }

      if (data) {
        await supabase.from('files').insert({
          project_id: selectedProjectId,
          file_name: file.name,
          file_url: data.path,
          file_type: getFileTypeFromName(file.name),
          file_size: file.size,
          uploaded_by: user.id,
        })
        successCount++
      }
    }

    setUploading(false)

    if (successCount > 0) {
      setUploadMessage(
        `${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully.`
      )
      fetchFiles(selectedProjectId)
      setTimeout(() => setUploadMessage(null), 4000)
    }
  }

  const handleDownload = async (file: FileRecord) => {
    const supabase = createClient()
    const { data } = await supabase.storage
      .from('project-files')
      .createSignedUrl(file.file_url, 3600)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
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
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Files</h1>
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">No projects yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Files</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload and manage project files.
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

      {/* Upload Section */}
      <div className="mb-8">
        <FileUploader onUpload={handleUpload} uploading={uploading} />
        {uploadMessage && (
          <p className="text-sm text-emerald-600 mt-3 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {uploadMessage}
          </p>
        )}
      </div>

      {/* File List */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-4">
          Uploaded Files
        </h2>

        {files.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500 text-sm">No files uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                    <FileTypeIcon type={file.file_type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-medium text-gray-900 truncate"
                      title={file.file_name}
                    >
                      {file.file_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(file.uploaded_at)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {file.file_type && (
                        <Badge variant="default">{file.file_type}</Badge>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatFileSize(file.file_size)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload(file)}
                    className="w-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
