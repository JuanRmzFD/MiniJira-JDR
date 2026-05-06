'use strict';

const requireSession = require('./requireSession');

function requireAdmin(req, res, next) {
  requireSession(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

module.exports = requireAdmin;
