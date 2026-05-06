import { api } from '@/shared/lib/api'
import type {
  Comment,
  DashboardMetrics,
  ExportType,
  Ticket,
  TicketDetail,
  TicketFilters,
  TicketPriority,
  TicketStatus,
  User,
  UserRole,
} from '@/shared/types'

// ── Input types ───────────────────────────────────────────────────────────────

export interface CreateTicketInput {
  title: string
  description?: string | null
  priority?: TicketPriority | null
  assignedToId?: string | null
  labels?: string[]
}

export interface UpdateTicketInput {
  version: number
  title?: string
  description?: string | null
  priority?: TicketPriority | null
  labels?: string[]
}

export interface ChangeStatusInput {
  status: TicketStatus
  version: number
}

export interface CreateUserInput {
  email: string
  displayName: string
  role: UserRole
}

export interface ExportCsvParams {
  type: ExportType
  from: string // YYYY-MM
  to: string   // YYYY-MM
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildTicketsParams(filters: TicketFilters): string {
  const params = new URLSearchParams()
  filters.status.forEach((s) => params.append('status', s))
  filters.priority.forEach((p) => params.append('priority', p))
  filters.labels.forEach((l) => params.append('labels', l))
  if (filters.assignedToId) params.set('assignedToId', filters.assignedToId)
  if (filters.createdFrom) params.set('createdFrom', filters.createdFrom)
  if (filters.createdTo) params.set('createdTo', filters.createdTo)
  if (filters.showArchived) params.set('showArchived', 'true')
  return params.toString()
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  me: () => api.get<User>('/api/auth/me'),
  login: (email: string, password: string) =>
    api.post<User>('/api/auth/login', { email, password }),
  logout: () => api.post<void>('/api/auth/logout'),
}

// ── Tickets ───────────────────────────────────────────────────────────────────

export const ticketsApi = {
  list: (filters: TicketFilters) => {
    const qs = buildTicketsParams(filters)
    return api.get<Ticket[]>(`/api/tickets${qs ? `?${qs}` : ''}`)
  },
  create: (data: CreateTicketInput) =>
    api.post<Ticket>('/api/tickets', data),
  get: (id: string) =>
    api.get<TicketDetail>(`/api/tickets/${id}`),
  update: (id: string, data: UpdateTicketInput) =>
    api.patch<Ticket>(`/api/tickets/${id}`, data),
  changeStatus: (id: string, data: ChangeStatusInput) =>
    api.patch<Ticket>(`/api/tickets/${id}/status`, data),
  assign: (id: string, assignedToId: string | null) =>
    api.patch<Ticket>(`/api/tickets/${id}/assign`, { assignedToId }),
  archive: (id: string) =>
    api.post<Ticket>(`/api/tickets/${id}/archive`),
  restore: (id: string) =>
    api.post<Ticket>(`/api/tickets/${id}/restore`),
}

// ── Comments ──────────────────────────────────────────────────────────────────

export const commentsApi = {
  list: (ticketId: string) =>
    api.get<Comment[]>(`/api/tickets/${ticketId}/comments`),
  create: (ticketId: string, content: string) =>
    api.post<Comment>(`/api/tickets/${ticketId}/comments`, { content }),
}

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  list: () =>
    api.get<User[]>('/api/users'),
  create: (data: CreateUserInput) =>
    api.post<User>('/api/users', data),
  changeRole: (id: string, role: UserRole) =>
    api.patch<User>(`/api/users/${id}/role`, { role }),
  deactivate: (id: string) =>
    api.patch<User>(`/api/users/${id}/deactivate`),
  reactivate: (id: string) =>
    api.patch<User>(`/api/users/${id}/reactivate`),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const dashboardApi = {
  metrics: () =>
    api.get<DashboardMetrics>('/api/dashboard/metrics'),
}

// ── Exports ───────────────────────────────────────────────────────────────────

export const exportsApi = {
  csv: ({ type, from, to }: ExportCsvParams) =>
    api.get<Blob>(`/api/exports/metrics?type=${type}&from=${from}&to=${to}`),
}
