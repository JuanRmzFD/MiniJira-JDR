'use strict';

const { Router } = require('express');
const requireSession = require('../middleware/requireSession');
const { listComments, createComment } = require('../services/comments.service');

const router = Router({ mergeParams: true });

router.get('/', requireSession, async (req, res, next) => {
  try {
    res.json(await listComments(req.params.ticketId));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireSession, async (req, res, next) => {
  try {
    const comment = await createComment(req.params.ticketId, req.body, req.user);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
