'use strict';

const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');
const { drizzle } = require('drizzle-orm/libsql');
const schema = require('./schema');
const config = require('../config');

const dbUrl = config.db.url.startsWith('file:')
  ? config.db.url
  : `file:${config.db.url}`;

const dbPath = dbUrl.replace(/^file:/, '');
fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

const client = createClient({ url: dbUrl });
const db = drizzle(client, { schema });

module.exports = { db, client };
