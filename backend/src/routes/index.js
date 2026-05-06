'use strict';

const { Router } = require('express');
const authRoutes      = require('./auth.routes');
const usersRoutes     = require('./users.routes');
const ticketsRoutes   = require('./tickets.routes');
const dashboardRoutes = require('./dashboard.routes');
const exportsRoutes   = require('./exports.routes');

const router = Router();

router.use('/auth',      authRoutes);
router.use('/users',     usersRoutes);
router.use('/tickets',   ticketsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/exports',   exportsRoutes);

module.exports = router;
