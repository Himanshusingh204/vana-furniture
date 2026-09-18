const express = require('express');
const router = express.Router();
const db = require('../db/database');
const events = require('../utils/events');
const wsHub = require('../wsHub');
const { requireAuth } = require('../middleware/auth');
const { reviewLimiter } = require('../middleware/security');
const { clampRating } = require('../utils/validate');

// Public: list approved reviews (product filter, featured filter)
router.get('/', (req, res) => {
  try {
    const { product_id, featured } = req.query;
    const list = db.getReviews({ product_id, featured, status: 'approved' });
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

// Public: submit a review (validated, length-capped in db layer)
router.post('/', reviewLimiter, (req, res) => {
  try {
    // Honeypot spam trap: hidden field ("website") real users never fill.
    // Bots that auto-fill every input trip it. Respond as if it succeeded
    // (without persisting anything) so spam scripts get no useful signal.
    if (req.body && typeof req.body.website === 'string' && req.body.website.trim() !== '') {
      db.logAudit('SECURITY_HONEYPOT_TRIPPED', `Review submission dropped: honeypot field populated (ip=${req.ip})`, 'WARNING', req.ip);
      return res.status(201).json({ success: true, data: { id: 'pending', status: 'pending' } });
    }

    const { product_id, buyer_name, buyer_city, rating, title, body } = req.body || {};
    if (!buyer_name || !body) {
      return res.status(400).json({ error: 'Name and review text are required.' });
    }
    if (!product_id) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    const prod = db.getProductById(product_id);
    if (!prod) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    const review = db.createReview({ product_id, buyer_name, buyer_city, rating: clampRating(rating), title, body, status: 'pending' });
    // Force moderation queue even if db layer defaults otherwise
    try { review.status = 'pending'; } catch (e) {}
    wsHub.broadcast({ type: 'REVIEW_SUBMITTED', review: { id: review.id, rating: review.rating, product_id: review.product_id } });
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Admin: full list incl. hidden
router.get('/all', requireAuth, (req, res) => {
  try {
    const list = db.getReviews({});
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

// Admin: moderate (approve/hide/feature)
router.patch('/:id', requireAuth, (req, res) => {
  try {
    const updated = db.moderateReview(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'Review not found' });
    events.emit('REVIEW_MODERATED', { id: updated.id, review: { id: updated.id, status: updated.status, product_id: updated.product_id }, message: `Review ${updated.id} moderated (${updated.status})` });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to moderate review' });
  }
});

// Admin: delete
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const ok = db.deleteReview(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Review not found' });
    events.emit('REVIEW_MODERATED', { id: req.params.id, deleted: true, message: `Review ${req.params.id} deleted` });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;
