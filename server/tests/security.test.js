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
const products = db.getProducts();
assert(products.length >= 6, `Product catalog seeded with ${products.length} architectural pieces (Expected >= 6)`);

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
assert(typeof analytics.total_cad_quotes === 'number' && analytics.total_cad_quotes >= 3, `Real CAD quote volume tracked: ${analytics.total_cad_quotes} inquiries`);
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
