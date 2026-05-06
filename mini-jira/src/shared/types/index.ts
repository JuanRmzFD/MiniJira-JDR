export type TicketStatus = 'Por hacer' | 'En progreso' | 'Listo'
export type TicketPriority = 'Baja' | 'Media' | 'Alta'
export type UserRole = 'admin' | 'user'
export type ExportType = 'summary' | 'detail'

export interface User {
  id: string
  displayName: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

export interface Ticket {
  id: string
  title: string
  description: string | null
  status: TicketStatus
  priority: TicketPriority | null
  assignedTo: User | null
  labels: string[]
  createdBy: User
  createdAt: string
  closedAt: string | null
  updatedAt: string
  version: number
  isArchived: boolean
}

export interface Comment {
  id: string
  ticketId: string
  content: string
  author: User
  createdAt: string
}

export interface StateTransition {
  id: string
  ticketId: string
  fromStatus: TicketStatus | null
  toStatus: TicketStatus
  changedBy: User
  changedAt: string
}

export interface TicketDetail extends Ticket {
  history: StateTransition[]
}

export interface DashboardMetrics {
  closedByMonth: { month: string; count: number }[]
  byStatus: { status: TicketStatus; count: number }[]
  byAssignee: { user: User; count: number }[]
  lastRefreshedAt: string
}

export interface TicketFilters {
  status: TicketStatus[]
  priority: TicketPriority[]
  labels: string[]
  assignedToId: string | null
  createdFrom: string | null
  createdTo: string | null
  showArchived: boolean
}

export type ApiError = {
  message: string
  statusCode: number
}
