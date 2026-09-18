const jwt = require('jsonwebtoken');
const config = require('../config');
const { isBlacklisted } = require('../utils/tokenBlacklist');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token required', code: 'AUTH_REQUIRED' });
  }

  const token = authHeader.split(' ')[1];

  // Revocation check: a token that has been explicitly logged out is
  // rejected even if it has not yet reached its natural JWT expiry.
  if (isBlacklisted(token)) {
    return res.status(401).json({ error: 'Unauthorized: Token has been revoked', code: 'TOKEN_REVOKED' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    // Soft IP-roam check: warn + audit, never hard-403. Attach user and continue.
    try {
      const boundIp = decoded.ip || decoded.boundIp || decoded.clientIp;
      const currentIp = req.ip || (req.connection && req.connection.remoteAddress);
      if (boundIp && currentIp && boundIp !== currentIp) {
        console.warn(`[auth] IP_ROAM_WARNING user=${decoded.email || decoded.id || 'unknown'} bound=${boundIp} current=${currentIp}`);
        try {
          const db = require('../db/database');
          if (db && typeof db.logAudit === 'function') {
            db.logAudit('IP_ROAM_WARNING', `Token IP roam for ${decoded.email || decoded.id || 'unknown'}: ${boundIp} -> ${currentIp}`, 'WARNING', currentIp);
          }
        } catch (e) {}
      }
    } catch (e) {}
    req.user = decoded;
    req.token = token; // raw JWT, needed by POST /api/auth/logout to blacklist it
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired authentication token', code: 'TOKEN_INVALID' });
  }
}

module.exports = {
  requireAuth
};
