'use strict';

const { Router } = require('express');
const requireSession = require('../middleware/requireSession');
const { generateCsv } = require('../services/exports.service');

const router = Router();

router.get('/metrics', requireSession, async (req, res, next) => {
  try {
    const { type, from, to } = req.query;
    const csv = await generateCsv(type, from, to);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="export-${type}-${from}-${to}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
