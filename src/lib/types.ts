export type UserRole = 'admin' | 'client'

export interface Profile {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
}

export type ProjectStatus =
  | 'Discovery Call'
  | 'Content Collection'
  | 'Wireframe'
  | 'Development'
  | 'Testing'
  | 'Launch'

export interface Project {
  id: string
  client_id: string
  project_name: string
  current_status: ProjectStatus
  progress_percentage: number
  expected_launch_date: string | null
  next_milestone: string | null
  created_at: string
  updated_at: string
  // Joined
  profiles?: Profile
}

export interface Milestone {
  id: string
  project_id: string
  title: string
  completed: boolean
  completed_date: string | null
  sort_order: number
  created_at: string
}

export interface FileRecord {
  id: string
  project_id: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  uploaded_by: string
  uploaded_at: string
  // Joined
  profiles?: Profile
}

export type Priority = 'Low' | 'Medium' | 'High'
export type RequestStatus = 'Pending' | 'In Progress' | 'Completed'

export interface ChangeRequest {
  id: string
  project_id: string
  title: string
  description: string | null
  priority: Priority
  status: RequestStatus
  created_by: string
  created_at: string
  updated_at: string
  // Joined
  profiles?: Profile
  projects?: Project
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue'

export interface Invoice {
  id: string
  project_id: string
  invoice_number: string
  amount: number
  issue_date: string
  due_date: string
  status: InvoiceStatus
  pdf_url: string | null
  created_at: string
  // Joined
  projects?: Project
}

export const PROJECT_STATUSES: ProjectStatus[] = [
  'Discovery Call',
  'Content Collection',
  'Wireframe',
  'Development',
  'Testing',
  'Launch',
]

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High']
export const REQUEST_STATUSES: RequestStatus[] = ['Pending', 'In Progress', 'Completed']
export const INVOICE_STATUSES: InvoiceStatus[] = ['Paid', 'Pending', 'Overdue']
