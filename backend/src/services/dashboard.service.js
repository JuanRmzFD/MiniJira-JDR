'use strict';

const { eq, and, isNotNull, sql } = require('drizzle-orm');
const { db } = require('../db/client');
const { tickets, users } = require('../db/schema');
const metricsCache = require('../lib/metricsCache');

const CODE_TO_STATUS = {
  por_hacer:   'Por hacer',
  en_progreso: 'En progreso',
  listo:       'Listo',
};

function toUserJson(row) {
  return {
    id:          row.id,
    displayName: row.displayName,
    email:       row.email,
    role:        row.role === 'usuario' ? 'user' : row.role,
    isActive:    row.isActive,
    createdAt:   row.createdAt,
  };
}

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 6; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    months.push(`${y}-${m}`);
  }
  return months;
}

async function computeMetrics() {
  const months    = getLast6Months();
  const fromMonth = months[0];
  const toMonth   = months[months.length - 1];

  const closedRows = await db
    .select({
      month: sql`strftime('%Y-%m', ${tickets.closedAt})`.as('month'),
      count: sql`COUNT(*)`.as('count'),
    })
    .from(tickets)
    .where(and(
      isNotNull(tickets.closedAt),
      sql`strftime('%Y-%m', ${tickets.closedAt}) >= ${fromMonth}`,
      sql`strftime('%Y-%m', ${tickets.closedAt}) <= ${toMonth}`,
    ))
    .groupBy(sql`strftime('%Y-%m', ${tickets.closedAt})`);

  const closedMap = Object.fromEntries(closedRows.map(r => [r.month, Number(r.count)]));
  const closedByMonth = months.map(m => ({ month: m, count: closedMap[m] ?? 0 }));

  const statusRows = await db
    .select({
      state: tickets.state,
      count: sql`COUNT(*)`.as('count'),
    })
    .from(tickets)
    .where(eq(tickets.archived, false))
    .groupBy(tickets.state);

  const byStatus = statusRows.map(r => ({
    status: CODE_TO_STATUS[r.state] ?? r.state,
    count:  Number(r.count),
  }));

  const assigneeRows = await db
    .select({
      assignedTo: tickets.assignedTo,
      count:      sql`COUNT(*)`.as('count'),
    })
    .from(tickets)
    .where(and(eq(tickets.archived, false), isNotNull(tickets.assignedTo)))
    .groupBy(tickets.assignedTo);

  assigneeRows.sort((a, b) => Number(b.count) - Number(a.count));

  const byAssignee = [];
  for (const r of assigneeRows) {
    const [user] = await db.select().from(users).where(eq(users.id, r.assignedTo)).limit(1);
    if (user) byAssignee.push({ user: toUserJson(user), count: Number(r.count) });
  }

  return { closedByMonth, byStatus, byAssignee };
}

async function getMetrics() {
  if (!metricsCache.isStale()) return metricsCache.get();
  const data = await computeMetrics();
  metricsCache.set(data);
  return metricsCache.get();
}

module.exports = { getMetrics };
