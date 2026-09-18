const express = require('express');
const router = express.Router();
const db = require('../db/database');
const wsHub = require('../wsHub');
const { requireAuth } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/security');
const { fail } = require('../utils/respond');

// Test-mode payment provider ("vanapay-test").
// Architecture: createPaymentIntent() is the single seam where Razorpay/Stripe
// replaces the stub — same request/response shape, real provider_ref + webhook.
// NEVER accept real card data here; only order_number + method + amount.

// Public: create a test intent for an existing order
// Auth: order_number + (email+phone matching the order OR valid admin Bearer) else 403.
router.post('/intent', paymentLimiter, (req, res) => {
  try {
    const { order_number, method, amount_inr, idempotency_key } = req.body || {};
    if (!order_number) return fail(res, 400, 'order_number is required.');
    const order = db.getOrderById(order_number);
    if (!order) return fail(res, 404, 'Order not found.');

    let isAdmin = false;
    try {
      const h = req.headers.authorization || '';
      if (h.startsWith('Bearer ')) {
        const jwt = require('jsonwebtoken');
        const config = require('../config');
        jwt.verify(h.split(' ')[1], config.JWT_SECRET);
        isAdmin = true;
      }
    } catch (e) { isAdmin = false; }

    if (!isAdmin) {
      const email = req.body.email || req.body.customer_email || req.body.client_email;
      const phone = req.body.phone || req.body.customer_phone || req.body.client_phone;
      const emailOk = typeof email === 'string' && email.trim().toLowerCase() === String(order.customer_email || '').trim().toLowerCase();
      const phoneOk = typeof phone === 'string' && phone.trim() === String(order.customer_phone || '').trim();
      if (!emailOk || !phoneOk) {
        return fail(res, 403, 'Order ownership verification failed (email+phone must match order, or admin token required).', 'FORBIDDEN');
      }
    }

    const result = db.createPaymentIntent({ order_number, method, amount_inr, idempotency_key });
    if (result.error) return res.status(result.status || 400).json({ error: result.error });
    res.status(result.deduped ? 200 : 201).json({ success: true, test_mode: true, data: result.intent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Public: confirm a test payment (simulates UPI success callback / webhook)
// Idempotent via intent_id | provider_ref | idempotency_key.
router.post('/confirm', paymentLimiter, (req, res) => {
  try {
    const { intent_id, provider_ref, idempotency_key } = req.body || {};
    const lookup = intent_id || provider_ref || idempotency_key;
    if (!lookup) return res.status(400).json({ error: 'intent_id is required.' });
    const result = db.confirmPayment(lookup, { provider_ref, idempotency_key });
    if (result.error) return res.status(result.status || 404).json({ error: result.error });
    wsHub.broadcast({
      type: 'PAYMENT_CONFIRMED',
      payment: { provider_ref: result.intent.provider_ref, order_number: result.intent.order_number, amount_inr: result.intent.amount_inr }
    });
    res.json({ success: true, test_mode: true, data: result.intent, order: result.order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Admin: payment ledger
router.get('/', requireAuth, (req, res) => {
  try {
    const list = db.getPayments();
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load payments' });
  }
});

module.exports = router;
