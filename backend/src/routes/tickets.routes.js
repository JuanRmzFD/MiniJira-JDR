'use strict';

const { Router } = require('express');
const requireSession  = require('../middleware/requireSession');
const requireAdmin    = require('../middleware/requireAdmin');
const commentsRoutes  = require('./comments.routes');
const {
  listTickets,
  createTicket,
  getTicket,
  updateTicket,
  changeStatus,
  assignTicket,
  archiveTicket,
  restoreTicket,
} = require('../services/tickets.service');

const router = Router();

router.use('/:ticketId/comments', commentsRoutes);

router.get('/', requireSession, async (req, res, next) => {
  try {
    const filters = {
      status:       req.query.status,
      priority:     req.query.priority,
      labels:       req.query.labels,
      assignedToId: req.query.assignedToId || undefined,
      createdFrom:  req.query.createdFrom  || undefined,
      createdTo:    req.query.createdTo    || undefined,
      showArchived: req.query.showArchived === 'true',
    };
    res.json(await listTickets(filters, req.user));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireSession, async (req, res, next) => {
  try {
    const ticket = await createTicket(req.body, req.user);
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireSession, async (req, res, next) => {
  try {
    res.json(await getTicket(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireSession, async (req, res, next) => {
  try {
    res.json(await updateTicket(req.params.id, req.body, req.user));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', requireSession, async (req, res, next) => {
  try {
    const { status, version } = req.body;
    res.json(await changeStatus(req.params.id, status, version, req.user));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/assign', requireAdmin, async (req, res, next) => {
  try {
    res.json(await assignTicket(req.params.id, req.body.assignedToId));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/archive', requireSession, async (req, res, next) => {
  try {
    res.json(await archiveTicket(req.params.id, req.user));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/restore', requireAdmin, async (req, res, next) => {
  try {
    res.json(await restoreTicket(req.params.id));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
