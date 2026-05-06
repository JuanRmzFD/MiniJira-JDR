'use strict';

require('dotenv').config();

const rawUrl = process.env.DATABASE_URL || './data/minijira.db';
const dbUrl = rawUrl.startsWith('file:') ? rawUrl : `file:${rawUrl}`;

/** @type {import('drizzle-kit').Config} */
module.exports = {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: { url: dbUrl },
};
