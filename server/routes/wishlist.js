const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { wishlistLimiter } = require('../middleware/security');

// Frictionless wishlist keyed by anonymous client_key (localStorage UUID).
// No auth: key is a random 32-char token, rows carry no PII.
router.get('/', (req, res) => {
  try {
    const list = db.getWishlist(req.query.client_key);
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load wishlist' });
  }
});

router.post('/toggle', wishlistLimiter, (req, res) => {
  try {
    const { client_key, product_id } = req.body || {};
    if (!client_key || !product_id) {
      return res.status(400).json({ error: 'client_key and product_id are required.' });
    }
    const result = db.getProductById(String(product_id)) ? db.toggleWishlist(String(client_key), String(product_id)) : null;
    if (!result) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    const list = db.getWishlist(String(client_key));
    res.json({ success: true, ...result, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
});

module.exports = router;
