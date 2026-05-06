'use strict';

const { Router } = require('express');
const requireSession = require('../middleware/requireSession');
const { loginWithPassword } = require('../services/auth.service');

const router = Router();

// POST /api/auth/login — credenciales email + contraseña
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }

    const result = await loginWithPassword(email, password);

    if (result.error === 'invalid_credentials') {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    if (result.error === 'inactive') {
      return res.status(403).json({ error: 'Cuenta desactivada. Contacta al administrador.' });
    }

    req.logIn(result.user, (err) => {
      if (err) return next(err);
      res.json(result.user);
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — usuario en sesión activa (sin guard; retorna 401 si no hay sesión)
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'No autenticado.' });
  res.json(req.user);
});

// POST /api/auth/logout — destruir sesión
router.post('/logout', requireSession, (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.status(204).end();
  });
});

module.exports = router;
