'use strict';

require('dotenv').config();

const app = require('./app');
const { runMigrations } = require('./db/migrate');
const config = require('./config');

runMigrations().then(() => {
  app.listen(config.port, () => {
    console.log(`Mini Jira API on port ${config.port} [${config.nodeEnv}]`);
  });
});
