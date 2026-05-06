'use strict';

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

require('./services/auth.service').initPassport();

const app = express();

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    maxAge: config.session.maxAge,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', routes);
app.use(errorHandler);

module.exports = app;
