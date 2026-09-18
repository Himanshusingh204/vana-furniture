'use strict';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Allowed chars: digits, +, -, spaces. Digit-count 7-15 enforced in isPhone().
const PHONE_RE = /^\+?[\d\-\s]{7,16}$/;

function isEmail(s) {
  return typeof s === 'string' && EMAIL_RE.test(s.trim());
}

function isPhone(s) {
  if (typeof s !== 'string') return false;
  const t = s.trim();
  if (!PHONE_RE.test(t)) return false;
  const digits = t.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function toPositiveInt(v, def) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def !== undefined ? def : NaN;
  const i = Math.floor(n);
  if (i <= 0) return def !== undefined ? def : NaN;
  return i;
}

function clampRating(r) {
  const n = Number(r);
  if (!Number.isFinite(n)) return 5;
  return Math.min(5, Math.max(1, Math.round(n)));
}

// Requires array non-empty; each item: product_id string non-empty, qty 1-99.
// Accepts quantity | qty. Returns { error } on failure or { value } normalized.
function validateOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'Items must be a non-empty array.' };
  }
  const value = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i] || {};
    const pid = it.product_id;
    if (typeof pid !== 'string' || !pid.trim()) {
      return { error: `Item ${i}: product_id string is required.` };
    }
    const rawQty = it.quantity !== undefined ? it.quantity : it.qty;
    const qty = Number(rawQty);
    if (!Number.isFinite(qty) || !Number.isInteger(Math.floor(qty)) || Math.floor(qty) !== qty || qty < 1 || qty > 99) {
      // Accept numeric strings that are integers 1-99
      return { error: `Item ${i}: qty must be an integer 1-99.` };
    }
    value.push({ product_id: pid.trim(), quantity: qty });
  }
  return { value };
}

// Requires client_name + email + phone (+ regex). Accepts both
// client_email/email and client_phone/phone key spellings.
// Returns { valid:true, email, phone, name } or { valid:false, errors }.
function validateQuoteBody(b) {
  const body = b || {};
  const errors = {};
  const name = body.client_name;
  const email = body.client_email !== undefined ? body.client_email : body.email;
  const phone = body.client_phone !== undefined ? body.client_phone : body.phone;

  if (!name || !String(name).trim()) errors.client_name = 'Client name is required.';
  if (!email || !String(email).trim()) {
    errors.email = 'Email is required.';
  } else if (!isEmail(String(email))) {
    errors.email = 'Invalid email format.';
  }
  if (!phone || !String(phone).trim()) {
    errors.phone = 'Phone is required.';
  } else if (!isPhone(String(phone))) {
    errors.phone = 'Invalid phone format.';
  }

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, email: String(email).trim(), phone: String(phone).trim(), name: String(name).trim() };
}

module.exports = {
  EMAIL_RE,
  PHONE_RE,
  isEmail,
  isPhone,
  toPositiveInt,
  clampRating,
  validateOrderItems,
  validateQuoteBody,
};
