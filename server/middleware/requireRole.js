// Role gate. Assumes an auth middleware already set req.user = { email, role }.
// Usage: router.put('/x', requireAuth, requireRole('editor', 'admin'), handler)
function requireRole(...allowed) {
  const set = new Set(allowed);
  return (req, res, next) => {
    const role = req.user && req.user.role;
    if (!role || !set.has(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = requireRole;
module.exports.requireRole = requireRole;