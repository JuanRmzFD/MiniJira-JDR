'use strict';

const { eq, and, asc, sql } = require('drizzle-orm');
const { randomUUID } = require('crypto');
const { db } = require('../db/client');
const { users } = require('../db/schema');
const config = require('../config');

const ROLE_TO_DB  = { user: 'usuario', admin: 'admin' };
const ROLE_TO_API = { usuario: 'user', admin: 'admin' };

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function toUserJson(row) {
  return {
    id:          row.id,
    displayName: row.displayName,
    email:       row.email,
    role:        ROLE_TO_API[row.role] ?? row.role,
    isActive:    row.isActive,
    createdAt:   row.createdAt,
  };
}

async function countActiveAdmins() {
  const [row] = await db
    .select({ n: sql`COUNT(*)` })
    .from(users)
    .where(and(eq(users.role, 'admin'), eq(users.isActive, true)));
  return Number(row.n);
}

async function listUsers() {
  const rows = await db.select().from(users).orderBy(asc(users.createdAt));
  return rows.map(toUserJson);
}

async function createUser(data) {
  const { email, displayName, role } = data;

  if (!email || !displayName || !role) {
    throw httpError(400, 'email, displayName y role son requeridos.');
  }
  if (!ROLE_TO_DB[role]) {
    throw httpError(400, 'Rol inválido. Valores permitidos: admin, user.');
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  if (
    config.oauth.google.hostedDomain &&
    !normalizedEmail.endsWith(`@${config.oauth.google.hostedDomain}`)
  ) {
    throw httpError(422, 'El email no pertenece al dominio corporativo.');
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
  if (existing) throw httpError(409, 'Ya existe un usuario con ese email.');

  const id  = randomUUID();
  const now = new Date().toISOString();

  await db.insert(users).values({
    id,
    email:       normalizedEmail,
    displayName: String(displayName).trim(),
    role:        ROLE_TO_DB[role],
    isActive:    true,
    createdAt:   now,
    updatedAt:   now,
  });

  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return toUserJson(row);
}

async function changeRole(id, role) {
  if (!ROLE_TO_DB[role]) {
    throw httpError(400, 'Rol inválido. Valores permitidos: admin, user.');
  }

  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!row) throw httpError(404, 'Usuario no encontrado.');

  if (row.role === 'admin' && role === 'user') {
    const adminCount = await countActiveAdmins();
    if (adminCount <= 1) {
      throw httpError(422, 'No se puede degradar al único administrador activo.');
    }
  }

  await db
    .update(users)
    .set({ role: ROLE_TO_DB[role], updatedAt: new Date().toISOString() })
    .where(eq(users.id, id));

  const [updated] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return toUserJson(updated);
}

async function deactivateUser(id) {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!row) throw httpError(404, 'Usuario no encontrado.');

  if (row.role === 'admin' && row.isActive) {
    const adminCount = await countActiveAdmins();
    if (adminCount <= 1) {
      throw httpError(422, 'No se puede desactivar al único administrador activo.');
    }
  }

  await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date().toISOString() })
    .where(eq(users.id, id));

  const [updated] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return toUserJson(updated);
}

async function reactivateUser(id) {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!row) throw httpError(404, 'Usuario no encontrado.');

  await db
    .update(users)
    .set({ isActive: true, updatedAt: new Date().toISOString() })
    .where(eq(users.id, id));

  const [updated] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return toUserJson(updated);
}

module.exports = { listUsers, createUser, changeRole, deactivateUser, reactivateUser };
