'use strict';

const config = require('../config');

let cached = null;
let cachedAt = null;

function get() {
  if (!cached) return null;
  return { ...cached, lastRefreshedAt: cachedAt };
}

function set(data) {
  cached = data;
  cachedAt = new Date().toISOString();
}

function isStale() {
  if (!cachedAt) return true;
  return Date.now() - new Date(cachedAt).getTime() > config.metricsRefreshMs;
}

module.exports = { get, set, isStale };
