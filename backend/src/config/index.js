'use strict';

function required(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

module.exports = {
  nodeEnv:    process.env.NODE_ENV || 'development',
  port:       parseInt(process.env.PORT || '3000', 10),
  appUrl:     process.env.APP_URL || 'http://localhost:3000',
  corsOrigin:  process.env.CORS_ORIGIN   || 'http://localhost:5173',
  frontendUrl: process.env.FRONTEND_URL  || 'http://localhost:5173',

  db: {
    url: process.env.DATABASE_URL || './data/minijira.db',
  },

  session: {
    secret: required('SESSION_SECRET'),
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '28800000', 10),
  },

  oauth: {
    provider:    process.env.OAUTH_PROVIDER || 'google',
    callbackUrl: process.env.OAUTH_CALLBACK_URL || 'http://localhost:3000/api/auth/callback',
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      hostedDomain: process.env.GOOGLE_HOSTED_DOMAIN || '',
    },
    azure: {
      clientId:     process.env.AZURE_CLIENT_ID || '',
      clientSecret: process.env.AZURE_CLIENT_SECRET || '',
      tenantId:     process.env.AZURE_TENANT_ID || '',
    },
  },

  smtp: {
    host:   process.env.SMTP_HOST || '',
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user:   process.env.SMTP_USER || '',
    pass:   process.env.SMTP_PASS || '',
    from:   process.env.EMAIL_FROM || 'Mini Jira <noreply@example.com>',
  },

  metricsRefreshMs: parseInt(process.env.METRICS_REFRESH_INTERVAL_MS || '900000', 10),
};
