'use strict';

const { eq, and, inArray, gte, lte, asc, isNull } = require('drizzle-orm');
const { alias } = require('drizzle-orm/sqlite-core');
const { randomUUID } = require('crypto');
const { db } = require('../db/client');
const { tickets, ticketLabels, stateTransitions, allowedTransitions, users } = require('../db/schema');

// ─── Mapeos DB ↔ API ─────────────────────────────────────────────────────────

const STATUS_TO_CODE = {
  'Por hacer':   'por_hacer',
  'En progreso': 'en_progreso',
  'Listo':       'listo',
};

const CODE_TO_STATUS = {
  por_hacer:   'Por hacer',
  en_progreso: 'En progreso',
  listo:       'Listo',
};

const PRIORITY_TO_CODE = {
  Baja:  'baja',
  Media: 'media',
  Alta:  'alta',
};

const CODE_TO_PRIORITY = {
  baja:  'Baja',
  media: 'Media',
  alta:  'Alta',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function toArray(val) {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}

function toUserJson(user) {
  if (!user || !user.id) return null;
  return {
    id:          user.id,
    displayName: user.displayName,
    email:       user.email,
    role:        user.role === 'usuario' ? 'user' : user.role,
    isActive:    user.isActive,
    createdAt:   user.createdAt,
  };
}

function toTicketJson(ticket, creator, assignee, labels) {
  return {
    id:          ticket.id,
    title:       ticket.title,
    description: ticket.description ?? null,
    status:      CODE_TO_STATUS[ticket.state],
    priority:    ticket.priority ? CODE_TO_PRIORITY[ticket.priority] : null,
    assignedTo:  toUserJson(assignee),
    labels,
    createdBy:   toUserJson(creator),
    createdAt:   ticket.createdAt,
    closedAt:    ticket.closedAt ?? null,
    updatedAt:   ticket.updatedAt,
    version:     ticket.version,
    isArchived:  ticket.archived,
  };
}

// Devuelve el ticket crudo de la BD (sin mapeo) para uso interno.
async function fetchRawTicketById(id) {
  const [row] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  return row ?? null;
}

// Devuelve el ticket mapeado a la forma de la API (sin history).
async function fetchTicketById(id) {
  const creator  = alias(users, 'creator');
  const assignee = alias(users, 'assignee');

  const [row] = await db
    .select({ ticket: tickets, creator, assignee })
    .from(tickets)
    .leftJoin(creator,  eq(tickets.creatorId,  creator.id))
    .leftJoin(assignee, eq(tickets.assignedTo, assignee.id))
    .where(eq(tickets.id, id))
    .limit(1);

  if (!row) return null;

  const labelRows = await db
    .select({ label: ticketLabels.label })
    .from(ticketLabels)
    .where(eq(ticketLabels.ticketId, id));

  return toTicketJson(row.ticket, row.creator, row.assignee, labelRows.map(r => r.label));
}

// Devuelve el historial de transiciones de estado de un ticket.
async function fetchTransitionsByTicketId(ticketId) {
  const changedByUser = alias(users, 'changedByUser');

  const rows = await db
    .select({ transition: stateTransitions, changedByUser })
    .from(stateTransitions)
    .leftJoin(changedByUser, eq(stateTransitions.changedBy, changedByUser.id))
    .where(eq(stateTransitions.ticketId, ticketId))
    .orderBy(asc(stateTransitions.createdAt));

  return rows.map(r => ({
    id:         r.transition.id,
    ticketId:   r.transition.ticketId,
    fromStatus: r.transition.fromState ? CODE_TO_STATUS[r.transition.fromState] : null,
    toStatus:   CODE_TO_STATUS[r.transition.toState],
    changedBy:  toUserJson(r.changedByUser),
    changedAt:  r.transition.createdAt,
  }));
}

// ─── Servicios ───────────────────────────────────────────────────────────────

async function listTickets(filters, sessionUser) {
  const { status, priority, labels, assignedToId, createdFrom, createdTo, showArchived } = filters;

  const conditions = [];

  if (!showArchived) {
    conditions.push(eq(tickets.archived, false));
  } else {
    conditions.push(eq(tickets.archived, true));
    if (sessionUser.role !== 'admin') {
      conditions.push(eq(tickets.creatorId, sessionUser.id));
    }
  }

  const statusCodes = toArray(status).map(s => STATUS_TO_CODE[s]).filter(Boolean);
  if (statusCodes.length > 0) conditions.push(inArray(tickets.state, statusCodes));

  const priorityCodes = toArray(priority).map(p => PRIORITY_TO_CODE[p]).filter(Boolean);
  if (priorityCodes.length > 0) conditions.push(inArray(tickets.priority, priorityCodes));

  if (assignedToId) conditions.push(eq(tickets.assignedTo, assignedToId));

  if (createdFrom) conditions.push(gte(tickets.createdAt, createdFrom));
  if (createdTo)   conditions.push(lte(tickets.createdAt, `${createdTo}T23:59:59.999Z`));

  const creator  = alias(users, 'creator');
  const assignee = alias(users, 'assignee');

  const rows = await db
    .select({ ticket: tickets, creator, assignee })
    .from(tickets)
    .leftJoin(creator,  eq(tickets.creatorId,  creator.id))
    .leftJoin(assignee, eq(tickets.assignedTo, assignee.id))
    .where(and(...conditions))
    .orderBy(asc(tickets.createdAt));

  if (rows.length === 0) return [];

  const ticketIds = rows.map(r => r.ticket.id);
  const labelRows = await db
    .select({ ticketId: ticketLabels.ticketId, label: ticketLabels.label })
    .from(ticketLabels)
    .where(inArray(ticketLabels.ticketId, ticketIds));

  const labelsByTicket = {};
  for (const lr of labelRows) {
    (labelsByTicket[lr.ticketId] ??= []).push(lr.label);
  }

  const labelFilter = toArray(labels);

  return rows
    .filter(r => {
      if (labelFilter.length === 0) return true;
      const tLabels = labelsByTicket[r.ticket.id] ?? [];
      return labelFilter.some(l => tLabels.includes(l));
    })
    .map(r => toTicketJson(
      r.ticket,
      r.creator,
      r.assignee,
      labelsByTicket[r.ticket.id] ?? [],
    ));
}

async function createTicket(data, sessionUser) {
  const { title, description, priority, assignedToId, labels } = data;

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw httpError(400, 'El título es requerido.');
  }
  if (title.trim().length > 150) {
    throw httpError(400, 'El título no puede superar 150 caracteres.');
  }
  if (priority != null && !PRIORITY_TO_CODE[priority]) {
    throw httpError(400, 'Prioridad inválida. Valores permitidos: Baja, Media, Alta.');
  }
  if (labels !== undefined && !Array.isArray(labels)) {
    throw httpError(400, 'labels debe ser un array.');
  }

  const id  = randomUUID();
  const now = new Date().toISOString();

  await db.insert(tickets).values({
    id,
    title:       title.trim(),
    description: description ?? null,
    state:       'por_hacer',
    priority:    priority ? PRIORITY_TO_CODE[priority] : null,
    creatorId:   sessionUser.id,
    assignedTo:  assignedToId ?? null,
    archived:    false,
    version:     1,
    createdAt:   now,
    updatedAt:   now,
  });

  const validLabels = (labels ?? []).filter(l => typeof l === 'string' && l.trim()).map(l => l.trim());

  await Promise.all([
    validLabels.length > 0
      ? db.insert(ticketLabels).values(validLabels.map(label => ({ ticketId: id, label })))
      : Promise.resolve(),
    db.insert(stateTransitions).values({
      id:        randomUUID(),
      ticketId:  id,
      fromState: null,
      toState:   'por_hacer',
      changedBy: sessionUser.id,
      createdAt: now,
    }),
  ]);

  return fetchTicketById(id);
}

async function getTicket(id) {
  const ticket = await fetchTicketById(id);
  if (!ticket) throw httpError(404, 'Ticket no encontrado.');
  const history = await fetchTransitionsByTicketId(id);
  return { ...ticket, history };
}

async function updateTicket(id, data, sessionUser) {
  const current = await fetchRawTicketById(id);
  if (!current) throw httpError(404, 'Ticket no encontrado.');

  if (sessionUser.role !== 'admin' && sessionUser.id !== current.creatorId) {
    throw httpError(403, 'Solo el creador o un administrador pueden editar este ticket.');
  }
  if (data.version == null || data.version !== current.version) {
    throw httpError(409, 'El ticket fue modificado por otro usuario. Recarga para ver los cambios.');
  }

  const { title, description, priority, labels } = data;

  if (title !== undefined) {
    if (!String(title).trim()) throw httpError(400, 'El título no puede estar vacío.');
    if (String(title).trim().length > 150) throw httpError(400, 'El título no puede superar 150 caracteres.');
  }
  if (priority !== undefined && priority !== null && !PRIORITY_TO_CODE[priority]) {
    throw httpError(400, 'Prioridad inválida. Valores permitidos: Baja, Media, Alta.');
  }
  if (labels !== undefined && !Array.isArray(labels)) {
    throw httpError(400, 'labels debe ser un array.');
  }

  const now     = new Date().toISOString();
  const updates = { version: current.version + 1, updatedAt: now };
  if (title       !== undefined) updates.title       = String(title).trim();
  if (description !== undefined) updates.description = description;
  if (priority    !== undefined) updates.priority    = priority ? PRIORITY_TO_CODE[priority] : null;

  await db.transaction(async (tx) => {
    await tx.update(tickets).set(updates).where(eq(tickets.id, id));

    if (labels !== undefined) {
      await tx.delete(ticketLabels).where(eq(ticketLabels.ticketId, id));
      const validLabels = labels.filter(l => typeof l === 'string' && l.trim()).map(l => l.trim());
      if (validLabels.length > 0) {
        await tx.insert(ticketLabels).values(validLabels.map(label => ({ ticketId: id, label })));
      }
    }
  });

  return fetchTicketById(id);
}

async function changeStatus(id, status, version, sessionUser) {
  const current = await fetchRawTicketById(id);
  if (!current) throw httpError(404, 'Ticket no encontrado.');

  if (version == null || version !== current.version) {
    throw httpError(409, 'El ticket fue modificado por otro usuario. Recarga para ver los cambios.');
  }

  const newStateCode = STATUS_TO_CODE[status];
  if (!newStateCode) throw httpError(400, 'Estado inválido.');

  const [transition] = await db
    .select()
    .from(allowedTransitions)
    .where(and(
      eq(allowedTransitions.fromState, current.state),
      eq(allowedTransitions.toState, newStateCode),
    ))
    .limit(1);

  if (!transition) {
    throw httpError(400, `Transición no permitida de "${CODE_TO_STATUS[current.state]}" a "${status}".`);
  }

  if (transition.adminOnly && sessionUser.role !== 'admin') {
    throw httpError(403, 'Solo un administrador puede realizar esta transición de estado.');
  }

  if (!transition.adminOnly && sessionUser.role !== 'admin') {
    if (sessionUser.id !== current.creatorId && sessionUser.id !== current.assignedTo) {
      throw httpError(403, 'Solo el creador, el asignado o un administrador pueden cambiar el estado.');
    }
  }

  const now = new Date().toISOString();
  let closedAt = current.closedAt;
  if (newStateCode === 'listo')      closedAt = now;
  else if (current.state === 'listo') closedAt = null;

  await db.transaction(async (tx) => {
    await tx.update(tickets).set({
      state:     newStateCode,
      version:   current.version + 1,
      updatedAt: now,
      closedAt,
    }).where(eq(tickets.id, id));

    await tx.insert(stateTransitions).values({
      id:        randomUUID(),
      ticketId:  id,
      fromState: current.state,
      toState:   newStateCode,
      changedBy: sessionUser.id,
      createdAt: now,
    });
  });

  return fetchTicketById(id);
}

async function assignTicket(id, assignedToId) {
  const current = await fetchRawTicketById(id);
  if (!current) throw httpError(404, 'Ticket no encontrado.');

  await db.update(tickets)
    .set({ assignedTo: assignedToId ?? null, updatedAt: new Date().toISOString() })
    .where(eq(tickets.id, id));

  return fetchTicketById(id);
}

async function archiveTicket(id, sessionUser) {
  const current = await fetchRawTicketById(id);
  if (!current) throw httpError(404, 'Ticket no encontrado.');

  if (sessionUser.role !== 'admin' && sessionUser.id !== current.creatorId) {
    throw httpError(403, 'Solo el creador o un administrador pueden archivar este ticket.');
  }

  await db.update(tickets)
    .set({ archived: true, updatedAt: new Date().toISOString() })
    .where(eq(tickets.id, id));

  return fetchTicketById(id);
}

async function restoreTicket(id) {
  const current = await fetchRawTicketById(id);
  if (!current) throw httpError(404, 'Ticket no encontrado.');

  await db.update(tickets)
    .set({ archived: false, updatedAt: new Date().toISOString() })
    .where(eq(tickets.id, id));

  return fetchTicketById(id);
}

module.exports = {
  listTickets,
  createTicket,
  getTicket,
  updateTicket,
  changeStatus,
  assignTicket,
  archiveTicket,
  restoreTicket,
};
