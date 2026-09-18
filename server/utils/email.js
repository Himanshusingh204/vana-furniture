'use strict';

// Thin nodemailer wrapper, configured entirely via env vars:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
//
// This is plumbing only — no welcome/confirmation email templates are wired
// up yet. When SMTP env vars are missing (dev/test, or before an operator
// configures a real mailbox), every call no-ops with a console.log instead
// of throwing, so nothing in dev/test ever breaks because outbound mail
// isn't configured.

const nodemailer = require('nodemailer');

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let cachedTransporter = null;
function getTransporter() {
  if (!isConfigured()) return null;
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  return cachedTransporter;
}

// Sends a plain-text/HTML email. Resolves to { sent: true, ... } on success,
// or { sent: false, reason } when SMTP isn't configured or sending failed —
// callers should treat both as non-fatal and continue the request.
async function sendMail({ to, subject, text, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[email:noop] SMTP not configured — would send "${subject}" to ${to}`);
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }
  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const info = await transporter.sendMail({ from, to, subject, text, html });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('[email] Failed to send mail:', err.message);
    return { sent: false, reason: err.message };
  }
}

// Builds the unsubscribe URL for a given newsletter token. Prefers the
// PUBLIC_API_URL / PUBLIC_BASE_URL env var if set (production), otherwise
// falls back to localhost for dev use.
function buildUnsubscribeUrl(token) {
  const base = process.env.PUBLIC_API_URL || process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${base.replace(/\/$/, '')}/api/newsletter/unsubscribe/${token}`;
}

module.exports = { sendMail, isConfigured, buildUnsubscribeUrl };
