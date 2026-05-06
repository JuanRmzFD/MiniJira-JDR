import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// ─── Tablas de referencia ─────────────────────────────────────────────────────

export const ticketStates = sqliteTable('ticket_states', {
  code:      text('code').primaryKey(),
  label:     text('label').notNull(),
  sortOrder: integer('sort_order').notNull(),
});

export const allowedTransitions = sqliteTable(
  'allowed_transitions',
  {
    fromState: text('from_state').notNull().references(() => ticketStates.code),
    toState:   text('to_state').notNull().references(() => ticketStates.code),
    adminOnly: integer('admin_only', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => ({ pk: primaryKey({ columns: [t.fromState, t.toState] }) }),
);

// ─── Usuarios ─────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id:           text('id').primaryKey(),
  email:        text('email').notNull().unique(),
  displayName:  text('display_name').notNull(),
  role:         text('role', { enum: ['admin', 'usuario'] as const }).notNull().default('usuario'),
  isActive:     integer('is_active', { mode: 'boolean' }).notNull().default(true),
  passwordHash: text('password_hash'),
  createdAt:    text('created_at').notNull(),
  updatedAt:    text('updated_at').notNull(),
});

// ─── Tickets ──────────────────────────────────────────────────────────────────

export const tickets = sqliteTable('tickets', {
  id:          text('id').primaryKey(),
  title:       text('title').notNull(),
  description: text('description'),
  state:       text('state').notNull().default('por_hacer').references(() => ticketStates.code),
  priority:    text('priority', { enum: ['baja', 'media', 'alta'] as const }),
  creatorId:   text('creator_id').notNull().references(() => users.id),
  assignedTo:  text('assigned_to').references(() => users.id),
  archived:    integer('archived', { mode: 'boolean' }).notNull().default(false),
  closedAt:    text('closed_at'),
  version:     integer('version').notNull().default(1),
  createdAt:   text('created_at').notNull(),
  updatedAt:   text('updated_at').notNull(),
});

export const ticketLabels = sqliteTable(
  'ticket_labels',
  {
    ticketId: text('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
    label:    text('label').notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.ticketId, t.label] }) }),
);

// ─── Audit trail ──────────────────────────────────────────────────────────────

export const stateTransitions = sqliteTable('state_transitions', {
  id:        text('id').primaryKey(),
  ticketId:  text('ticket_id').notNull().references(() => tickets.id),
  fromState: text('from_state'),           // NULL indica creación inicial del ticket
  toState:   text('to_state').notNull(),
  changedBy: text('changed_by').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
});

// ─── Comentarios ─────────────────────────────────────────────────────────────

export const comments = sqliteTable('comments', {
  id:        text('id').primaryKey(),
  ticketId:  text('ticket_id').notNull().references(() => tickets.id),
  authorId:  text('author_id').notNull().references(() => users.id),
  content:   text('content').notNull(),
  createdAt: text('created_at').notNull(),
});

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type TicketState        = InferSelectModel<typeof ticketStates>;
export type AllowedTransition  = InferSelectModel<typeof allowedTransitions>;

export type User    = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Ticket    = InferSelectModel<typeof tickets>;
export type NewTicket = InferInsertModel<typeof tickets>;

export type TicketLabel = InferSelectModel<typeof ticketLabels>;

export type StateTransition    = InferSelectModel<typeof stateTransitions>;
export type NewStateTransition = InferInsertModel<typeof stateTransitions>;

export type Comment    = InferSelectModel<typeof comments>;
export type NewComment = InferInsertModel<typeof comments>;
