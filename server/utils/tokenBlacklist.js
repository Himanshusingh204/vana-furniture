// In-memory JWT revocation list (blacklist) for logout support.
//
// Tokens are short-lived (1h, see routes/auth.js), so a full persisted
// revocation store is unnecessary — an in-memory Set keyed by the raw token
// string is sufficient: a server restart naturally "forgets" revocations,
// but it also invalidates every previously-issued token's session state on
// this process anyway (nothing malicious survives a restart any longer than
// the token's own expiry would have allowed). Entries are pruned once their
// original JWT expiry passes so the Set never grows unbounded.

const blacklist = new Map(); // token (string) -> expiry epoch seconds

function blacklistToken(token, expEpochSeconds) {
  if (!token) return;
  blacklist.set(token, expEpochSeconds || Math.floor(Date.now() / 1000) + 60 * 60);
}

function isBlacklisted(token) {
  if (!token) return false;
  return blacklist.has(token);
}

function pruneExpired() {
  const now = Math.floor(Date.now() / 1000);
  for (const [token, exp] of blacklist.entries()) {
    if (exp <= now) blacklist.delete(token);
  }
}

// Periodic cleanup so revoked-but-expired tokens don't linger in memory.
// unref() so this timer never keeps the process alive on its own.
const pruneInterval = setInterval(pruneExpired, 10 * 60 * 1000);
if (pruneInterval.unref) pruneInterval.unref();

module.exports = {
  blacklistToken,
  isBlacklisted,
  pruneExpired
};
