'use strict';

const { Router } = require('express');
const requireSession = require('../middleware/requireSession');
const { getMetrics } = require('../services/dashboard.service');

const router = Router();

router.get('/metrics', requireSession, async (req, res, next) => {
  try {
    res.json(await getMetrics());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
