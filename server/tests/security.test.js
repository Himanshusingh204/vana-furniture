const db = require('../db/database');
const { ALLOWED_EXTENSIONS } = require('../middleware/upload');

console.log('\x1b[34m%s\x1b[0m', 'Running VANA Atelier Security & Database Verification Suite...');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('\x1b[32m%s\x1b[0m', `  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error('\x1b[31m%s\x1b[0m', `  ✗ FAIL: ${message}`);
    failed++;
  }
}

// Test 1: Products database loaded
// (Phase 8 trim, see db/seed.js: seed data intentionally holds one
// representative product per collection, so the floor here is >= 1, not the
// pre-trim >= 6.)
const products = db.getProducts();
assert(products.length >= 1, `Product catalog seeded with ${products.length} architectural pieces (Expected >= 1)`);

// Test 2: Sheesham filter works
const sheesham = db.getProducts({ wood: 'Sheesham' });
assert(sheesham.length > 0, `Wood query successfully filtered Sheesham pieces (${sheesham.length} found)`);

// Test 3: CAD Extension whitelist security
assert(ALLOWED_EXTENSIONS.includes('.dwg'), 'CAD whitelist permits .dwg files');
assert(ALLOWED_EXTENSIONS.includes('.step'), 'CAD whitelist permits .step files');
assert(!ALLOWED_EXTENSIONS.includes('.exe'), 'Security check: Executable .exe is strictly blocked');
assert(!ALLOWED_EXTENSIONS.includes('.php'), 'Security check: Script file .php is strictly blocked');

// Test 4: Real database analytics calculation
const analytics = db.getRealAnalytics();
assert(typeof analytics.total_revenue_inr === 'number' && analytics.total_revenue_inr > 0, `Real total revenue calculated: INR ${analytics.total_revenue_inr.toLocaleString('en-IN')}`);
assert(typeof analytics.total_cad_quotes === 'number' && analytics.total_cad_quotes >= 1, `Real CAD quote volume tracked: ${analytics.total_cad_quotes} inquiries`);
assert(analytics.active_manufacturing_jobs >= 0, `Active factory jobs calculated: ${analytics.active_manufacturing_jobs}`);

// Test 5: Audit logging & IP masking
const testLog = db.logAudit('TEST_EVENT', 'Security test verification event', 'INFO', '192.168.1.45:51234');
assert(testLog && testLog.ip.includes('.xxx'), `Audit logger successfully masked IP for privacy: ${testLog.ip}`);

console.log('\n\x1b[33m%s\x1b[0m', `Summary: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m%s\x1b[0m', 'All architectural security & database assertions passed successfully.\n');
}

// Phase 1 admin asserts (server-independent wiring checks, no live server needed)
const productsRouter = require('../routes/products');
const { requireAuth } = require('../middleware/auth');

function assertRejectsExeAsImage() {
  let result = {};
  productsRouter.productImageFileFilter(
    {},
    { originalname: 'malware.exe', mimetype: 'application/octet-stream' },
    (err, ok) => { result = { err, ok }; }
  );
  assert(!result.ok && result.err && /jpg, png, or webp/.test(result.err.message), 'Security check: .exe renamed as image rejected by product filter (octet-stream -> 400)');
}

function assertUnauthPutRejected() {
  const putLayer = (productsRouter.stack || []).find((l) => l.route && l.route.path === '/:id' && l.route.methods.put);
  const wired = !!putLayer && putLayer.route.stack.some((s) => s.handle === requireAuth);
  let status = 0;
  requireAuth({ headers: {} }, { status: (c) => ({ json: () => { status = c; } }) }, () => { status = 200; });
  assert(wired && status === 401, 'Security check: PUT /api/products/:id gated by JWT (no token -> 401)');
}

function assertPriceValidation() {
  const bad = productsRouter.validateProductEdit({ name: 'Test Chair', description: 'Solid wood chair', price_inr: 0 }).errors;
  const good = productsRouter.validateProductEdit({ name: 'Test Chair', description: 'Solid wood chair', price_inr: 89000 }).errors;
  assert(bad.price_inr && Object.keys(good).length === 0, 'Security check: PUT price validation rejects zero price (400 with errors.price_inr)');
}

assertRejectsExeAsImage();
assertUnauthPutRejected();
assertPriceValidation();

// Phase A/D hardening asserts (server-independent wiring checks, no live server needed)
const { isValidStage } = require('../routes/orders');
assert(isValidStage('Dispatched') === true && isValidStage('Hacked') === false, 'Security check: order stage enum accepts Dispatched and rejects garbage stage');

const smokeReview = db.createReview({ product_id: null, buyer_name: 'TEST-SMOKE-REVIEW', buyer_city: 'Jodhpur', rating: 5, title: 'Smoke', body: 'x'.repeat(2000) });
assert(smokeReview.body.length <= 600, `Security check: review body length capped at 600 chars (stored ${smokeReview.body.length})`);
db.deleteReview(smokeReview.id);

const securityLimiters = require('../middleware/security');
assert(typeof securityLimiters.reviewLimiter === 'function' && typeof securityLimiters.newsletterLimiter === 'function' && typeof securityLimiters.wishlistLimiter === 'function' && typeof securityLimiters.paymentLimiter === 'function', 'Security check: strict limiters wired (review/newsletter/wishlist/payment)');

console.log('\n\x1b[33m%s\x1b[0m', `Phase 1 summary: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────
// Phase 2: Role-gating audit — requireRole wiring + /api/users API
// ─────────────────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const config = require('../config');
const requireRole = require('../middleware/requireRole');
const { requireAuth: requireAuthFn } = require('../middleware/auth');

function mintToken(role, email) {
  const payload = { email: email || `${role || 'none'}@test.vana` };
  if (role) payload.role = role;
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '1h' });
}

function mockRes() {
  let statusCode = 0;
  let body = null;
  const res = {
    status(c) { statusCode = c; return this; },
    json(b) { body = b; return this; }
  };
  return { res, getStatus: () => statusCode, getBody: () => body };
}

// Runs requireAuth (if a token is given) then requireRole(...allowed),
// mirroring the exact chain wired in each route below.
function runAuthThenRole(token, allowed) {
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  const req = { headers, ip: '127.0.0.1' };
  const { res, getStatus } = mockRes();
  let reachedAuth = false;
  requireAuthFn(req, res, () => { reachedAuth = true; });
  if (!reachedAuth) return { status: getStatus(), reachedHandler: false };
  let reachedHandler = false;
  requireRole(...allowed)(req, res, () => { reachedHandler = true; });
  return { status: getStatus() || (reachedHandler ? 200 : 0), reachedHandler };
}

// requireRole wiring: same 3-deep stack shape as products.js
// (requireAuth -> requireRole(...) -> handler).
function assertRoleGateWired(router, method, routePath, label) {
  const layer = (router.stack || []).find((l) => l.route && l.route.path === routePath && l.route.methods[method]);
  const wired = !!layer && layer.route.stack.length === 3 && layer.route.stack[0].handle === requireAuthFn;
  assert(wired, `Security check: ${label} gated by requireAuth + requireRole (3-deep stack)`);
}

const ordersRouterForRoles = require('../routes/orders');
const quotesRouterForRoles = require('../routes/quotes');
const reviewsRouterForRoles = require('../routes/reviews');
const newsletterRouterForRoles = require('../routes/newsletter');
const paymentsRouterForRoles = require('../routes/payments');
const usersRouterForRoles = require('../routes/users');

assertRoleGateWired(ordersRouterForRoles, 'patch', '/:id/stage', 'PATCH /api/orders/:id/stage');
assertRoleGateWired(quotesRouterForRoles, 'patch', '/:id/status', 'PATCH /api/quotes/:id/status');
assertRoleGateWired(reviewsRouterForRoles, 'patch', '/:id', 'PATCH /api/reviews/:id');
assertRoleGateWired(reviewsRouterForRoles, 'delete', '/:id', 'DELETE /api/reviews/:id');
assertRoleGateWired(reviewsRouterForRoles, 'get', '/all', 'GET /api/reviews/all');
assertRoleGateWired(newsletterRouterForRoles, 'get', '/', 'GET /api/newsletter');
assertRoleGateWired(paymentsRouterForRoles, 'get', '/', 'GET /api/payments');
assertRoleGateWired(usersRouterForRoles, 'get', '/', 'GET /api/users');
assertRoleGateWired(usersRouterForRoles, 'post', '/', 'POST /api/users');
assertRoleGateWired(usersRouterForRoles, 'patch', '/:email', 'PATCH /api/users/:email');
assertRoleGateWired(usersRouterForRoles, 'delete', '/:email', 'DELETE /api/users/:email');

// Direct middleware behavior: editor-or-admin gate (orders/quotes/reviews mutations)
{
  const noToken = runAuthThenRole(null, ['editor', 'admin']);
  assert(noToken.status === 401 && !noToken.reachedHandler, 'Security check: no token -> 401 on editor-or-admin gated route');

  const noRoleToken = mintToken(null);
  const noRole = runAuthThenRole(noRoleToken, ['editor', 'admin']);
  assert(noRole.status === 403 && !noRole.reachedHandler, 'Security check: valid JWT with no role -> 403 on editor-or-admin gated route');

  const editorToken = mintToken('editor');
  const editorResult = runAuthThenRole(editorToken, ['editor', 'admin']);
  assert(editorResult.reachedHandler === true, 'Security check: valid editor JWT -> passes editor-or-admin gate on orders/quotes/reviews mutation routes');

  const adminToken = mintToken('admin');
  const adminResult = runAuthThenRole(adminToken, ['editor', 'admin']);
  assert(adminResult.reachedHandler === true, 'Security check: valid admin JWT -> passes editor-or-admin gate');
}

// Direct middleware behavior: admin-only gate (/api/users)
{
  const editorToken = mintToken('editor');
  const editorOnAdminOnly = runAuthThenRole(editorToken, ['admin']);
  assert(editorOnAdminOnly.status === 403 && !editorOnAdminOnly.reachedHandler, 'Security check: editor JWT rejected (403) from admin-only /api/users endpoints');

  const noTokenOnAdminOnly = runAuthThenRole(null, ['admin']);
  assert(noTokenOnAdminOnly.status === 401 && !noTokenOnAdminOnly.reachedHandler, 'Security check: unauthenticated request rejected (401) from admin-only /api/users endpoints');

  const adminToken = mintToken('admin');
  const adminOnAdminOnly = runAuthThenRole(adminToken, ['admin']);
  assert(adminOnAdminOnly.reachedHandler === true, 'Security check: admin JWT passes admin-only gate on /api/users endpoints');
}

console.log('\n\x1b[33m%s\x1b[0m', `Phase 2 (role-gating) summary: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────
// Phase 3: Live /api/users CRUD contract (ephemeral in-process server, no
// external test-runner deps — Node's built-in fetch talks to it).
// ─────────────────────────────────────────────────────────────────────────
(async function runUsersApiTests() {
  const express = require('express');
  const fs = require('fs');
  const path = require('path');
  const http = require('http');

  const usersDataPath = path.join(__dirname, '..', 'data', 'users.json');
  const hadExistingFile = fs.existsSync(usersDataPath);
  const originalContents = hadExistingFile ? fs.readFileSync(usersDataPath, 'utf8') : null;

  const app = express();
  app.use(express.json());
  app.use('/api/users', require('../routes/users'));

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/api/users`;

  const adminToken = mintToken('admin', config.ADMIN_EMAIL);
  const editorToken = mintToken('editor', 'editor@test.vana');
  const authHeader = (t) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

  try {
    // Create succeeds as admin
    const createRes = await fetch(base, {
      method: 'POST',
      headers: authHeader(adminToken),
      body: JSON.stringify({ email: 'new.editor@test.vana', password: 'supersecret1', role: 'editor' })
    });
    const createBody = await createRes.json();
    assert(createRes.status === 201 && createBody.success && createBody.data.email === 'new.editor@test.vana' && !createBody.data.passwordHash, 'Users API: POST /api/users creates a user as admin (201, no passwordHash leaked)');

    // Create rejected as editor (403)
    const createAsEditorRes = await fetch(base, {
      method: 'POST',
      headers: authHeader(editorToken),
      body: JSON.stringify({ email: 'blocked@test.vana', password: 'supersecret1', role: 'viewer' })
    });
    assert(createAsEditorRes.status === 403, 'Users API: POST /api/users rejected (403) when caller is editor, not admin');

    // Duplicate email rejected
    const dupRes = await fetch(base, {
      method: 'POST',
      headers: authHeader(adminToken),
      body: JSON.stringify({ email: 'new.editor@test.vana', password: 'supersecret1', role: 'viewer' })
    });
    assert(dupRes.status === 409, 'Users API: POST /api/users rejects a duplicate email (409)');

    // Invalid role rejected
    const badRoleRes = await fetch(base, {
      method: 'POST',
      headers: authHeader(adminToken),
      body: JSON.stringify({ email: 'badrole@test.vana', password: 'supersecret1', role: 'superuser' })
    });
    assert(badRoleRes.status === 400, 'Users API: POST /api/users rejects an invalid role (400)');

    // List returns users without passwordHash
    const listRes = await fetch(base, { headers: authHeader(adminToken) });
    const listBody = await listRes.json();
    assert(listRes.status === 200 && Array.isArray(listBody.data) && listBody.data.every((u) => !('passwordHash' in u)), 'Users API: GET /api/users lists users and never returns passwordHash');

    // Last-admin delete protection: the seeded config admin is the only admin
    const deleteAdminRes = await fetch(`${base}/${encodeURIComponent(config.ADMIN_EMAIL)}`, { method: 'DELETE', headers: authHeader(adminToken) });
    const deleteAdminBody = await deleteAdminRes.json();
    assert(deleteAdminRes.status === 400 && /admin/i.test(deleteAdminBody.error || ''), 'Users API: DELETE /api/users/:email refuses to delete the last remaining admin (400)');

    // Non-admin role can be deleted freely
    const deleteEditorRes = await fetch(`${base}/new.editor@test.vana`, { method: 'DELETE', headers: authHeader(adminToken) });
    assert(deleteEditorRes.status === 200, 'Users API: DELETE /api/users/:email removes a non-admin user (200)');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    // Restore the users.json store to its pre-test state so this suite
    // never leaves behind test fixtures in a real credential store.
    if (hadExistingFile) {
      fs.writeFileSync(usersDataPath, originalContents, 'utf8');
    } else if (fs.existsSync(usersDataPath)) {
      fs.unlinkSync(usersDataPath);
    }
  }

  console.log('\n\x1b[33m%s\x1b[0m', `Phase 3 (users API) summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
})();
