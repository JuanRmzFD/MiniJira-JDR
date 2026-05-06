'use strict';

const passport = require('passport');
const bcrypt = require('bcryptjs');
const { eq } = require('drizzle-orm');
const { db } = require('../db/client');
const { users } = require('../db/schema');

function toUserSession(row) {
  return {
    id:          row.id,
    displayName: row.displayName,
    email:       row.email,
    role:        row.role === 'usuario' ? 'user' : row.role,
    isActive:    row.isActive,
    createdAt:   row.createdAt,
  };
}

function initPassport() {
  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      done(null, row ? toUserSession(row) : null);
    } catch (err) {
      done(err);
    }
  });
}

async function loginWithPassword(email, password) {
  const normalizedEmail = String(email).trim().toLowerCase();

  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!row || !row.passwordHash) return { error: 'invalid_credentials' };
  if (!row.isActive)             return { error: 'inactive' };

  const valid = await bcrypt.compare(String(password), row.passwordHash);
  if (!valid) return { error: 'invalid_credentials' };

  return { user: toUserSession(row) };
}

module.exports = { initPassport, toUserSession, loginWithPassword };
