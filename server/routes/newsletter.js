const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { newsletterLimiter } = require('../middleware/security');

// Public: subscribe (unique email, validated in db layer)
router.post('/subscribe', newsletterLimiter, (req, res) => {
  try {
    const { email, name } = req.body || {};
    const result = db.subscribeNewsletter(email, name);
    if (result.error) return res.status(400).json({ error: result.error });
    if (result.duplicate) return res.json({ success: true, duplicate: true, message: 'Already subscribed.' });
    res.status(201).json({ success: true, data: result.entry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Admin: subscriber list (emails visible to owner only, behind JWT)
router.get('/', requireAuth, (req, res) => {
  try {
    const list = db.getNewsletter();
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load subscribers' });
  }
});

// Public: unsubscribe via the token issued at signup (soft-delete — flips a
// status flag rather than removing the record). API-only: this link is
// clicked straight out of an email client, so a plain JSON confirmation is
// enough and no frontend page is required.
router.get('/unsubscribe/:token', (req, res) => {
  try {
    const result = db.unsubscribeNewsletter(req.params.token);
    if (result.error) return res.status(404).json({ error: result.error });
    if (result.alreadyUnsubscribed) {
      return res.json({ success: true, message: 'You were already unsubscribed from the VANA newsletter.' });
    }
    res.json({ success: true, message: 'You have been unsubscribed from the VANA newsletter.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process unsubscribe request' });
  }
});

module.exports = router;
