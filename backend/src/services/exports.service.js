'use strict';

const { stringify } = require('csv-stringify/sync');
const { eq, and, isNotNull, asc, inArray, sql } = require('drizzle-orm');
const { alias } = require('drizzle-orm/sqlite-core');
const { db } = require('../db/client');
const { tickets, ticketLabels, users } = require('../db/schema');

const CODE_TO_STATUS = {
  por_hacer:   'Por hacer',
  en_progreso: 'En progreso',
  listo:       'Listo',
};

const CODE_TO_PRIORITY = {
  baja:  'Baja',
  media: 'Media',
  alta:  'Alta',
};

const MONTH_RE = /^\d{4}-\d{2}$/;

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function monthRange(from, to) {
  const months = [];
  let [y, m] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

async function generateCsv(type, from, to) {
  if (!type || !from || !to) {
    throw httpError(400, 'type, from y to son requeridos.');
  }
  if (!['summary', 'detail'].includes(type)) {
    throw httpError(400, 'type debe ser summary o detail.');
  }
  if (!MONTH_RE.test(from) || !MONTH_RE.test(to)) {
    throw httpError(400, 'from y to deben tener formato YYYY-MM.');
  }
  if (from > to) {
    throw httpError(400, 'from no puede ser posterior a to.');
  }

  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  const totalMonths = (ty - fy) * 12 + (tm - fm) + 1;
  if (totalMonths > 12) {
    throw httpError(400, 'El rango máximo es de 12 meses.');
  }

  if (type === 'summary') {
    const months = monthRange(from, to);

    const [closedRows, openRows, inProgressRows] = await Promise.all([
      db.select({
        month: sql`strftime('%Y-%m', ${tickets.closedAt})`.as('month'),
        count: sql`COUNT(*)`.as('count'),
      })
        .from(tickets)
        .where(and(
          isNotNull(tickets.closedAt),
          sql`strftime('%Y-%m', ${tickets.closedAt}) >= ${from}`,
          sql`strftime('%Y-%m', ${tickets.closedAt}) <= ${to}`,
        ))
        .groupBy(sql`strftime('%Y-%m', ${tickets.closedAt})`),

      db.select({
        month: sql`strftime('%Y-%m', ${tickets.createdAt})`.as('month'),
        count: sql`COUNT(*)`.as('count'),
      })
        .from(tickets)
        .where(and(
          eq(tickets.archived, false),
          eq(tickets.state, 'por_hacer'),
          sql`strftime('%Y-%m', ${tickets.createdAt}) >= ${from}`,
          sql`strftime('%Y-%m', ${tickets.createdAt}) <= ${to}`,
        ))
        .groupBy(sql`strftime('%Y-%m', ${tickets.createdAt})`),

      db.select({
        month: sql`strftime('%Y-%m', ${tickets.createdAt})`.as('month'),
        count: sql`COUNT(*)`.as('count'),
      })
        .from(tickets)
        .where(and(
          eq(tickets.archived, false),
          eq(tickets.state, 'en_progreso'),
          sql`strftime('%Y-%m', ${tickets.createdAt}) >= ${from}`,
          sql`strftime('%Y-%m', ${tickets.createdAt}) <= ${to}`,
        ))
        .groupBy(sql`strftime('%Y-%m', ${tickets.createdAt})`),
    ]);

    const closedMap     = Object.fromEntries(closedRows.map(r => [r.month, Number(r.count)]));
    const openMap       = Object.fromEntries(openRows.map(r => [r.month, Number(r.count)]));
    const inProgressMap = Object.fromEntries(inProgressRows.map(r => [r.month, Number(r.count)]));

    const records = months.map(m => ({
      month:           m,
      closedCount:     closedMap[m]     ?? 0,
      openCount:       openMap[m]       ?? 0,
      inProgressCount: inProgressMap[m] ?? 0,
    }));

    return stringify(records, {
      header:  true,
      columns: ['month', 'closedCount', 'openCount', 'inProgressCount'],
    });
  }

  // detail
  const creator  = alias(users, 'creator');
  const assignee = alias(users, 'assignee');

  const rows = await db
    .select({ ticket: tickets, creator, assignee })
    .from(tickets)
    .leftJoin(creator,  eq(tickets.creatorId,  creator.id))
    .leftJoin(assignee, eq(tickets.assignedTo, assignee.id))
    .where(and(
      sql`strftime('%Y-%m', ${tickets.createdAt}) >= ${from}`,
      sql`strftime('%Y-%m', ${tickets.createdAt}) <= ${to}`,
    ))
    .orderBy(asc(tickets.createdAt));

  if (rows.length === 0) {
    return stringify([], {
      header:  true,
      columns: ['id', 'title', 'status', 'priority', 'createdBy', 'assignedTo', 'labels', 'createdAt', 'closedAt'],
    });
  }

  const ticketIds = rows.map(r => r.ticket.id);
  const labelRows = await db
    .select({ ticketId: ticketLabels.ticketId, label: ticketLabels.label })
    .from(ticketLabels)
    .where(inArray(ticketLabels.ticketId, ticketIds));

  const labelsByTicket = {};
  for (const lr of labelRows) {
    (labelsByTicket[lr.ticketId] ??= []).push(lr.label);
  }

  const records = rows.map(r => ({
    id:         r.ticket.id,
    title:      r.ticket.title,
    status:     CODE_TO_STATUS[r.ticket.state] ?? r.ticket.state,
    priority:   r.ticket.priority ? CODE_TO_PRIORITY[r.ticket.priority] : '',
    createdBy:  r.creator?.displayName  ?? '',
    assignedTo: r.assignee?.displayName ?? '',
    labels:     (labelsByTicket[r.ticket.id] ?? []).join(', '),
    createdAt:  r.ticket.createdAt,
    closedAt:   r.ticket.closedAt ?? '',
  }));

  return stringify(records, {
    header:  true,
    columns: ['id', 'title', 'status', 'priority', 'createdBy', 'assignedTo', 'labels', 'createdAt', 'closedAt'],
  });
}

module.exports = { generateCsv };
