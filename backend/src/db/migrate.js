'use strict';

const path = require('path');
const { migrate } = require('drizzle-orm/libsql/migrator');
const { db } = require('./client');

async function runMigrations() {
  await migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle') });
  console.log('Migrations applied');
}

module.exports = { runMigrations };
