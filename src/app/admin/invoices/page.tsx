'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/app/admin/layout'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Invoice, InvoiceStatus, Project } from '@/lib/types'
import { INVOICE_STATUSES } from '@/lib/types'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'

interface InvoiceWithProject extends Omit<Invoice, 'projects'> {
  projects?: { project_name: string; client_id: string }
}

const today = new Date().toISOString().split('T')[0]

export default function AdminInvoicesPage() {
  const { profile } = useUser()
  const [invoices, setInvoices] = useState<InvoiceWithProject[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [formData, setFormData] = useState({
    project_id: '',
    invoice_number: '',
    amount: '',
    issue_date: today,
    due_date: '',
    status: 'Pending' as InvoiceStatus,
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const fetchInvoices = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, projects(project_name, client_id)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
    } else {
      setInvoices((data as InvoiceWithProject[]) ?? [])
    }
    setLoading(false)
  }, [])

  const fetchProjects = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('projects')
      .select('*, profiles:client_id(name)')
      .order('project_name')
    setProjects(data ?? [])
  }, [])

  useEffect(() => {
    fetchInvoices()
    fetchProjects()
  }, [fetchInvoices, fetchProjects])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    const supabase = createClient()
    let pdf_url: string | null = null

    // Upload PDF if provided
    if (pdfFile) {
      const fileName = `${Date.now()}_${pdfFile.name}`
      const filePath = `${formData.project_id}/${fileName}`
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, pdfFile)

      if (uploadError) {
        setMessage({ type: 'error', text: `Upload failed: ${uploadError.message}` })
        setSubmitting(false)
        return
      }
      pdf_url = filePath
    }

    const { error } = await supabase.from('invoices').insert({
      project_id: formData.project_id,
      invoice_number: formData.invoice_number,
      amount: parseFloat(formData.amount),
      issue_date: formData.issue_date,
      due_date: formData.due_date,
      status: formData.status,
      pdf_url,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Invoice created successfully' })
      setFormData({
        project_id: projects[0]?.id ?? '',
        invoice_number: '',
        amount: '',
        issue_date: today,
        due_date: '',
        status: 'Pending',
      })
      setPdfFile(null)
      fetchInvoices()
      setTimeout(() => {
        setModalOpen(false)
        setMessage(null)
      }, 800)
    }

    setSubmitting(false)
  }

  async function handleStatusChange(
    invoiceId: string,
    newStatus: InvoiceStatus
  ) {
    const supabase = createClient()
    const { error } = await supabase
      .from('invoices')
      .update({ status: newStatus })
      .eq('id', invoiceId)

    if (!error) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: newStatus } : inv
        )
      )
    }
  }

  async function handleDownloadPdf(invoice: InvoiceWithProject) {
    if (!invoice.pdf_url) return
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('invoices')
      .createSignedUrl(invoice.pdf_url, 3600)

    if (error) {
      console.error('Error generating signed URL:', error)
      return
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  async function handleUploadPdf(invoiceId: string, file: File) {
    const invoice = invoices.find((i) => i.id === invoiceId)
    if (!invoice) return

    const supabase = createClient()
    const fileName = `${Date.now()}_${file.name}`
    const filePath = `${invoice.project_id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload failed:', uploadError)
      return
    }

    const { error } = await supabase
      .from('invoices')
      .update({ pdf_url: filePath })
      .eq('id', invoiceId)

    if (!error) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId ? { ...inv, pdf_url: filePath } : inv
        )
      )
    }
  }

  function getStatusVariant(status: InvoiceStatus) {
    switch (status) {
      case 'Paid':
        return 'success' as const
      case 'Pending':
        return 'warning' as const
      case 'Overdue':
        return 'danger' as const
      default:
        return 'default' as const
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading invoices...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage client invoices and payments
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({
              project_id: projects[0]?.id ?? '',
              invoice_number: '',
              amount: '',
              issue_date: today,
              due_date: '',
              status: 'Pending',
            })
            setPdfFile(null)
            setMessage(null)
            setModalOpen(true)
          }}
        >
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
          New Invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
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
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <p className="text-sm text-gray-500">No invoices yet</p>
        </div>
      ) : (
        <Table
          headers={[
            'Invoice #',
            'Project',
            'Amount',
            'Issue Date',
            'Due Date',
            'Status',
            'PDF',
            'Actions',
          ]}
        >
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {invoice.invoice_number}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {invoice.projects?.project_name ?? '—'}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {formatCurrency(invoice.amount)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {formatDate(invoice.issue_date)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {formatDate(invoice.due_date)}
              </td>
              <td className="px-6 py-4">
                <Badge variant={getStatusVariant(invoice.status)}>
                  {invoice.status}
                </Badge>
              </td>
              <td className="px-6 py-4">
                {invoice.pdf_url ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadPdf(invoice)}
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
                      className="mr-1"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    PDF
                  </Button>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <select
                    value={invoice.status}
                    onChange={(e) =>
                      handleStatusChange(
                        invoice.id,
                        e.target.value as InvoiceStatus
                      )
                    }
                    className="appearance-none px-2 py-1 pr-6 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {INVOICE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      ref={(el) => {
                        uploadRefs.current[invoice.id] = el
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUploadPdf(invoice.id, file)
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        uploadRefs.current[invoice.id]?.click()
                      }
                      title={invoice.pdf_url ? 'Replace PDF' : 'Upload PDF'}
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
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Create Invoice Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setMessage(null)
        }}
        title="New Invoice"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Project"
            value={formData.project_id}
            onChange={(e) =>
              setFormData((f) => ({ ...f, project_id: e.target.value }))
            }
            options={projects.map((p) => ({
              value: p.id,
              label: `${p.project_name}${
                (p as any).profiles?.name
                  ? ` (${(p as any).profiles.name})`
                  : ''
              }`,
            }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Invoice Number"
              value={formData.invoice_number}
              onChange={(e) =>
                setFormData((f) => ({
                  ...f,
                  invoice_number: e.target.value,
                }))
              }
              required
              placeholder="INV-001"
            />
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) =>
                setFormData((f) => ({ ...f, amount: e.target.value }))
              }
              required
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Issue Date"
              type="date"
              value={formData.issue_date}
              onChange={(e) =>
                setFormData((f) => ({ ...f, issue_date: e.target.value }))
              }
              required
            />
            <Input
              label="Due Date"
              type="date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData((f) => ({ ...f, due_date: e.target.value }))
              }
              required
            />
          </div>
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) =>
              setFormData((f) => ({
                ...f,
                status: e.target.value as InvoiceStatus,
              }))
            }
            options={INVOICE_STATUSES.map((s) => ({
              value: s,
              label: s,
            }))}
          />

          {/* PDF Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PDF (optional)
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  setPdfFile(e.target.files?.[0] ?? null)
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
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
                  className="mr-1"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Choose File
              </Button>
              {pdfFile && (
                <span className="text-sm text-gray-600">{pdfFile.name}</span>
              )}
            </div>
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
              {submitting ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
