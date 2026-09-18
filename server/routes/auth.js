const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const db = require('../db/database');
const fs = require('fs');
const path = require('path');
const { authLimiter } = require('../middleware/security');
const { requireAuth } = require('../middleware/auth');
const { blacklistToken } = require('../utils/tokenBlacklist');

// In-memory failed login attempt tracker per IP
const failedAttempts = new Map(); // key: IP, value: { count, blockedUntil }

function isBlocked(ip) {
  const record = failedAttempts.get(ip);
  if (!record) return false;
  if (Date.now() > record.blockedUntil) {
    failedAttempts.delete(ip);
    return false;
  }
  return true;
}

// Brute-force policy (documented): 5 consecutive failures from one IP triggers a
// short 5-minute cool-down (429). Short window chosen deliberately so roaming
// mobile networks / shared office NATs are never locked out for long; the
// express-rate-limit authLimiter remains the primary throttle. Session IP drift
// is warn-only everywhere (see middleware/auth.js + GET /me below) — roaming
// clients stay logged in.
function recordFailedAttempt(ip) {
  const record = failedAttempts.get(ip) || { count: 0, blockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.blockedUntil = Date.now() + 5 * 60 * 1000; // Block for 5 minutes
  }
  failedAttempts.set(ip, record);
}

function clearFailedAttempts(ip) {
  failedAttempts.delete(ip);
}

router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  const clientIp = req.ip || '127.0.0.1';

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Check if IP is blocked due to too many failed attempts
  if (isBlocked(clientIp)) {
    db.logAudit('LOGIN_IP_BLOCKED', `Blocked login attempt from IP ${clientIp} due to excessive failures`, 'WARNING', clientIp);
    return res.status(429).json({ error: 'Too many failed attempts. Try again after 5 minutes.' });
  }

  // Load users from users.json, fall back to config-based single-admin check if file missing
  let users = [];
  let user = null;
  try {
    const usersData = fs.readFileSync(path.join(__dirname, '..', 'data', 'users.json'), 'utf8');
    users = JSON.parse(usersData).users || [];
    user = users.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
  } catch (err) {
    // Fall back to config-based check if users.json is missing
    const isEmailMatch = email.toLowerCase().trim() === config.ADMIN_EMAIL.toLowerCase().trim();
    if (isEmailMatch) {
      try {
        user = { email: config.ADMIN_EMAIL, passwordHash: config.ADMIN_PASSWORD_HASH, role: 'admin' };
      } catch (e) {
        // no-op
      }
    }
  }

  if (!user) {
    recordFailedAttempt(clientIp);
    const record = failedAttempts.get(clientIp);
    db.logAudit('FAILED_LOGIN_ATTEMPT', `Failed admin login attempt for identifier: ${email.substring(0, 3)}*** (attempt ${record?.count || 1}/5)`, 'WARNING', clientIp);
    return res.status(401).json({ error: 'Invalid administrative credentials' });
  }

  // Deactivated accounts (users.js PATCH active:false) are rejected at login
  // even with a correct password.
  if (user.active === false) {
    db.logAudit('LOGIN_DEACTIVATED_ACCOUNT', `Login attempt for deactivated account: ${email.substring(0, 3)}***`, 'WARNING', clientIp);
    return res.status(401).json({ error: 'This account has been deactivated' });
  }

  // Verify bcrypt password — fail closed: a corrupted hash denies access, never
  // falls back to plaintext comparison (removed 2026-09-15, see CHANGELOG).
  let isPasswordMatch = false;
  try {
    isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
  } catch (err) {
    db.logAudit('LOGIN_HASH_FAILURE', 'Password hash verification failed; access denied fail-closed', 'ERROR', clientIp);
    return res.status(401).json({ error: 'Invalid administrative credentials' });
  }

  if (!isPasswordMatch) {
    recordFailedAttempt(clientIp);
    const record = failedAttempts.get(clientIp);
    db.logAudit('FAILED_LOGIN_ATTEMPT', `Failed admin login attempt for identifier: ${email.substring(0, 3)}*** (attempt ${record?.count || 1}/5)`, 'WARNING', clientIp);
    return res.status(401).json({ error: 'Invalid administrative credentials' });
  }

  // Clear failed attempts on successful login
  clearFailedAttempts(clientIp);

  // Generate signed JWT with 1h validity (reduced from 24h), include role claim and IP binding
  const token = jwt.sign(
    {
      email: user.email,
      role: user.role,
      ip: clientIp // IP binding for session security
    },
    config.JWT_SECRET,
    { expiresIn: '1h' }
  );

  db.logAudit('ADMIN_LOGIN_SUCCESS', `Admin logged in from ${clientIp}`, 'INFO', clientIp);

  res.json({
    token,
    role: user.role,
    email: user.email
  });
});

// Logout: revoke the presented token immediately rather than waiting for its
// natural 1h JWT expiry. Requires a valid (not-yet-revoked) token so this
// endpoint can't be used to blindly blacklist arbitrary tokens.
router.post('/logout', requireAuth, (req, res) => {
  const clientIp = req.ip || '127.0.0.1';
  try {
    const exp = req.user && req.user.exp; // JWT 'exp' claim, seconds since epoch
    blacklistToken(req.token, exp);
    db.logAudit('ADMIN_LOGOUT', `Admin logged out from ${clientIp}`, 'INFO', clientIp);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process logout' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  const clientIp = req.ip || '127.0.0.1';

  // Roaming-tolerant session check: warn-only (audit + console), never hard-403.
  // Matches server/middleware/auth.js soft IP-roam policy so mobile / NAT IP
  // drift does not log admins out mid-session.
  if (req.user.ip && req.user.ip !== clientIp) {
    try {
      console.warn(`[auth] IP_ROAM_WARNING user=${req.user.email || 'unknown'} bound=${req.user.ip} current=${clientIp}`);
      db.logAudit('IP_ROAM_WARNING', `Token IP roam for ${req.user.email || 'unknown'}: ${req.user.ip} -> ${clientIp}`, 'WARNING', clientIp);
    } catch (e) {}
  }

  res.json({
    user: req.user
  });
});

module.exports = router;
