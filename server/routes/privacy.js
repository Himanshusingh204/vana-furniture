const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { privacyLimiter } = require('../middleware/security');

// Public: request data deletion. This does not delete anything automatically
// (there is no single durable customer identity to resolve across quotes,
// orders, reviews and newsletter entries) — it logs an auditable request for
// the admin to action manually, mirroring the honeypot + validation pattern
// used by quotes.js and reviews.js.
router.post('/delete-request', privacyLimiter, (req, res) => {
  try {
    const { email, name, details, website } = req.body || {};

    // Honeypot spam trap: hidden field ("website") real users never fill.
    if (typeof website === 'string' && website.trim() !== '') {
      db.logAudit('SECURITY_HONEYPOT_TRIPPED', `Privacy delete-request dropped: honeypot field populated (ip=${req.ip})`, 'WARNING', req.ip);
      return res.status(201).json({
        success: true,
        message: 'Your data deletion request has been received. We will act on it within a reasonable timeframe.'
      });
    }

    const clean = String(email || '').trim().toLowerCase().slice(0, 160);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    const cleanName = String(name || '').trim().slice(0, 80);
    const cleanDetails = String(details || '').trim().slice(0, 1000);

    db.logAudit(
      'PRIVACY_DELETE_REQUEST',
      `Data deletion requested by ${clean.slice(0, 3)}***${cleanName ? ` (${cleanName})` : ''}${cleanDetails ? ` — notes: ${cleanDetails.slice(0, 200)}` : ''}`,
      'WARNING',
      req.ip
    );
    db.save();

    res.status(201).json({
      success: true,
      message: 'Your data deletion request has been received. We will act on it within a reasonable timeframe and confirm by email.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record deletion request' });
  }
});

module.exports = router;
