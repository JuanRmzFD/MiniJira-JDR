'use strict';

const nodemailer = require('nodemailer');
const config = require('../config');

const transport = nodemailer.createTransport({
  host:   config.smtp.host,
  port:   config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

async function sendMail({ to, subject, text, html }) {
  await transport.sendMail({ from: config.smtp.from, to, subject, text, html });
}

module.exports = { sendMail };
