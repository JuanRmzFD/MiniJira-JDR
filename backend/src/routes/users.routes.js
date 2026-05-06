'use strict';

const { Router } = require('express');
const requireSession = require('../middleware/requireSession');
const requireAdmin   = require('../middleware/requireAdmin');
const { listUsers, createUser, changeRole, deactivateUser, reactivateUser } = require('../services/users.service');

const router = Router();

router.get('/', requireSession, async (req, res, next) => {
  try {
    res.json(await listUsers());
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/role', requireAdmin, async (req, res, next) => {
  try {
    res.json(await changeRole(req.params.id, req.body.role));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/deactivate', requireAdmin, async (req, res, next) => {
  try {
    res.json(await deactivateUser(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/reactivate', requireAdmin, async (req, res, next) => {
  try {
    res.json(await reactivateUser(req.params.id));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
