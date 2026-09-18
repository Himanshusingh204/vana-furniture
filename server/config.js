const path = require('path');

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// ─────────────────────────────────────────────────────────────────────────
// Dev-only fallbacks. These are intentionally weak/well-known placeholders
// so local development works out of the box without a .env file. They are
// NEVER used in production — see the fail-closed boot check below, which
// halts startup rather than silently running with these values.
// ─────────────────────────────────────────────────────────────────────────
const DEV_ONLY_JWT_SECRET = 'dev-only-insecure-jwt-secret-do-not-use-in-production';
// Dev-only bcrypt hash (10 rounds). Provided only so `npm run dev` has a working
// admin login without any setup. Generate your own with:
//   node -e "console.log(require('bcryptjs').hashSync('yourPassword', 10))"
const DEV_ONLY_ADMIN_PASSWORD_HASH = '$2a$10$Q8YL7NBbOqbykAoh8UcqFeDwETY/SfD7MP9NwO.KO6OhbNW45yn3K';

// Fail closed: production must not boot on shipped/default secrets.
if (isProduction && !process.env.JWT_SECRET) {
  console.error('╔══════════════════════════════════════════════════════════════╗');
  console.error('║  FATAL: JWT_SECRET environment variable is required in       ║');
  console.error('║  production. Refusing to start with an insecure default.     ║');
  console.error('║  Set JWT_SECRET (see server/.env.example) and restart.       ║');
  console.error('╚══════════════════════════════════════════════════════════════╝');
  process.exit(1);
}
if (isProduction && !process.env.ADMIN_PASSWORD_HASH) {
  console.error('╔══════════════════════════════════════════════════════════════╗');
  console.error('║  FATAL: ADMIN_PASSWORD_HASH environment variable is required ║');
  console.error('║  in production. Refusing to start with an insecure default.  ║');
  console.error('║  Set ADMIN_PASSWORD_HASH (see server/.env.example) and       ║');
  console.error('║  restart.                                                     ║');
  console.error('╚══════════════════════════════════════════════════════════════╝');
  process.exit(1);
}

if (!isProduction && !process.env.JWT_SECRET) {
  console.warn('[DEV ONLY] JWT_SECRET not set — using an insecure built-in fallback. Set JWT_SECRET before deploying.');
}
if (!isProduction && !process.env.ADMIN_PASSWORD_HASH) {
  console.warn('[DEV ONLY] ADMIN_PASSWORD_HASH not set — using an insecure built-in fallback. Set ADMIN_PASSWORD_HASH before deploying.');
}

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET || DEV_ONLY_JWT_SECRET,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'atelier@jodhpur-furniture.com',
  // Plaintext ADMIN_PASSWORD fallback removed 2026-09-15 (fail closed — only bcrypt hashes authenticate).
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || DEV_ONLY_ADMIN_PASSWORD_HASH,
  DB_PATH: path.join(__dirname, 'data', 'furniture_store.json'),
  CAD_UPLOAD_DIR: path.join(__dirname, 'uploads', 'cad'),
  MAX_CAD_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 120,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5000',
        'http://127.0.0.1:5000'
      ]
};

module.exports = config;
