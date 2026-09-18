const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db/database');
const events = require('../utils/events');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

// Product image uploads (jpg/png/webp, 5MB cap)
const productUploadDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(productUploadDir)) fs.mkdirSync(productUploadDir, { recursive: true });

function productImageFileFilter(req, file, cb) {
  const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
  cb(ok ? null : new Error('Only jpg, png, or webp images allowed'), ok);
}

const productImageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, productUploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: productImageFileFilter
});

// Map multer errors to 400 field errors
function handleProductUpload(req, res, next) {
  productImageUpload.array('images', 6)(req, res, (err) => {
    if (err) return res.status(400).json({ errors: { images: err.message } });
    next();
  });
}

// Shared edit validation, returns { errors, values }
function validateProductEdit(body) {
  const errors = {};
  const name = String((body && body.name) || '').trim();
  const description = String((body && body.description) || '').trim();
  const price = Number(body && body.price_inr);
  const wood = String((body && body.wood_type) || '').trim();
  const imageUrl = String((body && body.imageUrl) || '').trim();
  if (!name) errors.name = 'Name is required';
  if (!description) errors.description = 'Description is required';
  if (!Number.isFinite(price) || price <= 0) errors.price_inr = 'Price must be above zero';
  if (imageUrl && !/^https?:\/\/.+\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(imageUrl)) {
    errors.imageUrl = 'Image URL must be http(s) ending in jpg, png, or webp';
  }
  return { errors, values: { name, description, price, wood, imageUrl } };
}

// Get all products with filters
router.get('/', (req, res) => {
  try {
    const products = db.getProducts(req.query);
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// Get single product
router.get('/:id', (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve product' });
  }
});

// Create product (Editor or Admin only)
router.post('/', requireAuth, requireRole('editor', 'admin'), (req, res) => {
  try {
    const newProduct = db.createProduct(req.body);
    events.emit('PRODUCT_CREATED', { id: newProduct.id, product: { id: newProduct.id }, message: `New product ${newProduct.name || newProduct.id} added to catalog` });
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    res.status(400).json({ error: 'Invalid product specifications' });
  }
});

// Update product (Admin only, multipart edit with image upload or URL)
router.put('/:id', requireAuth, requireRole('editor', 'admin'), handleProductUpload, (req, res) => {
  const { errors, values } = validateProductEdit(req.body || {});
  if (Object.keys(errors).length) return res.status(400).json({ errors });

  let keep = [];
  let remove = [];
  try {
    keep = req.body.keepImages ? JSON.parse(req.body.keepImages) : [];
    remove = req.body.removeImages ? JSON.parse(req.body.removeImages) : [];
    if (!Array.isArray(keep) || !Array.isArray(remove)) throw new Error('bad lists');
  } catch (e) { return res.status(400).json({ errors: { images: 'Image lists must be valid JSON' } }); }

  const existing = db.getProductById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  // Merge images: kept existing minus removed, plus new uploads and URL
  const current = Array.isArray(existing.images) ? existing.images : [];
  const removeSet = new Set(remove);
  let merged = current.filter((img) => !removeSet.has(img));
  if (keep.length) merged = merged.filter((img) => keep.includes(img));
  const uploaded = (req.files || []).map((f) => `/uploads/products/${f.filename}`);
  merged = [...merged, ...uploaded];
  if (values.imageUrl) merged.push(values.imageUrl);

  try {
    const updated = db.updateProduct(req.params.id, {
      name: values.name,
      description: values.description,
      price_inr: values.price,
      wood_type: values.wood,
      images: merged
    });
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    events.emit('PRODUCT_UPDATED', { id: updated.id, product: { id: updated.id }, message: `Product ${updated.id} updated` });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (Admin only)
router.delete('/:id', requireAuth, requireRole('editor', 'admin'), (req, res) => {
  try {
    const deleted = db.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }
    events.emit('PRODUCT_DELETED', { id: req.params.id, message: `Product ${req.params.id} removed from catalog` });
    res.json({ success: true, message: 'Product successfully removed from catalog' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
// Exposed for security wiring asserts
module.exports.productImageFileFilter = productImageFileFilter;
module.exports.validateProductEdit = validateProductEdit;
