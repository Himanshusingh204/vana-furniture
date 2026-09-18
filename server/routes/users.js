const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('../config');
const db = require('../db/database');
const dbQueue = require('../utils/dbQueue');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { isEmail } = require('../utils/validate');
const { ok, fail } = require('../utils/respond');

const USERS_PATH = path.join(__dirname, '..', 'data', 'users.json');
const ROLES = ['admin', 'editor', 'viewer'];

// Same shape auth.js reads: { users: [{ email, passwordHash, role, active, createdAt }] }.
// If the store hasn't been created yet, seed it from the config-based fallback
// admin so there is always at least one active admin to manage the others.
function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.users) ? parsed.users : [];
  } catch (err) {
    return [
      {
        email: config.ADMIN_EMAIL,
        passwordHash: config.ADMIN_PASSWORD_HASH,
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString()
      }
    ];
  }
}

// Atomic write (tmp + rename), matching server/db/database.js's save() pattern.
function writeUsersAtomic(users) {
  const dir = path.dirname(USERS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tempPath = `${USERS_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify({ users }, null, 2), 'utf8');
  fs.renameSync(tempPath, USERS_PATH);
}

function toSafeUser(u) {
  return { email: u.email, role: u.role, active: u.active !== false, createdAt: u.createdAt || null };
}

// GET /api/users — list all users (admin only)
router.get('/', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const users = readUsers();
    res.json({ success: true, count: users.length, data: users.map(toSafeUser) });
  } catch (err) {
    fail(res, 500, 'Failed to load users');
  }
});

// POST /api/users — create a new user (admin only)
router.post('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { email, password, role } = req.body || {};

  if (!email || !isEmail(String(email))) {
    return fail(res, 400, 'A valid email is required.', 'INVALID_EMAIL');
  }
  if (!password || String(password).length < 8) {
    return fail(res, 400, 'Password must be at least 8 characters.', 'INVALID_PASSWORD');
  }
  if (!role || !ROLES.includes(role)) {
    return fail(res, 400, `Role must be one of: ${ROLES.join(', ')}.`, 'INVALID_ROLE');
  }

  const cleanEmail = String(email).trim().toLowerCase();

  const result = await dbQueue.run(async () => {
    const users = readUsers();
    if (users.find((u) => u.email.toLowerCase() === cleanEmail)) {
      return { error: 'A user with this email already exists.' };
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    const newUser = {
      email: cleanEmail,
      passwordHash,
      role,
      active: true,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeUsersAtomic(users);
    return { user: newUser };
  });

  if (result.error) {
    return fail(res, 409, result.error, 'DUPLICATE_EMAIL');
  }

  db.logAudit('USER_CREATED', `User ${cleanEmail} created with role ${role} by ${req.user.email}`, 'INFO', req.ip);
  db.save();

  res.status(201).json({ success: true, data: toSafeUser(result.user) });
}));

// PATCH /api/users/:email — update role and/or active flag (admin only)
router.patch('/:email', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const targetEmail = String(req.params.email || '').trim().toLowerCase();
  const { role, active } = req.body || {};

  if (role !== undefined && !ROLES.includes(role)) {
    return fail(res, 400, `Role must be one of: ${ROLES.join(', ')}.`, 'INVALID_ROLE');
  }
  if (active !== undefined && typeof active !== 'boolean') {
    return fail(res, 400, 'active must be a boolean.', 'INVALID_ACTIVE');
  }

  const result = await dbQueue.run(() => {
    const users = readUsers();
    const user = users.find((u) => u.email.toLowerCase() === targetEmail);
    if (!user) return { error: 'not_found' };

    // Refuse to strip admin role or deactivate the last remaining active admin.
    const demotingAdmin = role !== undefined && role !== 'admin' && user.role === 'admin';
    const deactivatingAdmin = active === false && user.role === 'admin' && user.active !== false;
    if (demotingAdmin || deactivatingAdmin) {
      const activeAdmins = users.filter((u) => u.role === 'admin' && u.active !== false && u.email.toLowerCase() !== targetEmail);
      if (activeAdmins.length === 0) {
        return { error: 'last_admin' };
      }
    }

    if (role !== undefined) user.role = role;
    if (active !== undefined) user.active = active;
    user.updatedAt = new Date().toISOString();
    writeUsersAtomic(users);
    return { user };
  });

  if (result.error === 'not_found') return fail(res, 404, 'User not found');
  if (result.error === 'last_admin') {
    return fail(res, 400, 'Cannot demote or deactivate the last remaining admin.', 'LAST_ADMIN');
  }

  if (active === false) {
    db.logAudit('USER_DEACTIVATED', `User ${targetEmail} deactivated by ${req.user.email}`, 'INFO', req.ip);
  }
  if (role !== undefined) {
    db.logAudit('USER_ROLE_CHANGED', `User ${targetEmail} role changed to ${role} by ${req.user.email}`, 'INFO', req.ip);
  }
  db.save();

  res.json({ success: true, data: toSafeUser(result.user) });
}));

// DELETE /api/users/:email — remove a user (admin only), refusing to remove the last admin
router.delete('/:email', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const targetEmail = String(req.params.email || '').trim().toLowerCase();

  const result = await dbQueue.run(() => {
    const users = readUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === targetEmail);
    if (idx === -1) return { error: 'not_found' };

    const target = users[idx];
    if (target.role === 'admin' && target.active !== false) {
      const otherActiveAdmins = users.filter((u, i) => i !== idx && u.role === 'admin' && u.active !== false);
      if (otherActiveAdmins.length === 0) {
        return { error: 'last_admin' };
      }
    }

    users.splice(idx, 1);
    writeUsersAtomic(users);
    return { ok: true };
  });

  if (result.error === 'not_found') return fail(res, 404, 'User not found');
  if (result.error === 'last_admin') {
    return fail(res, 400, 'Cannot delete the last remaining admin.', 'LAST_ADMIN');
  }

  db.logAudit('USER_DELETED', `User ${targetEmail} deleted by ${req.user.email}`, 'INFO', req.ip);
  db.save();

  res.json({ success: true, message: 'User deleted.' });
}));

module.exports = router;
