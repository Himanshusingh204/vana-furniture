const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const config = require('../config');

// Standard API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP address. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Stricter Rate Limiter for CAD Uploads & Custom Quotes
const quoteUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Quote submission rate limit reached. Please contact our Basni office directly for high-volume inquiries.',
    code: 'UPLOAD_RATE_LIMIT'
  }
});

// Strictest Rate Limiter for Authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Administrative endpoint locked for 15 minutes.',
    code: 'AUTH_THROTTLED'
  }
});

// Strict Rate Limiter for Reviews
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Review submission rate limit reached. Please try again later.',
    code: 'REVIEW_RATE_LIMIT'
  }
});

// Strict Rate Limiter for Newsletter subscriptions
const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Newsletter subscription rate limit reached. Please try again later.',
    code: 'NEWSLETTER_RATE_LIMIT'
  }
});

// Rate Limiter for privacy data-deletion requests
const privacyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Data deletion request rate limit reached. Please try again later.',
    code: 'PRIVACY_RATE_LIMIT'
  }
});

// Rate Limiter for Wishlist toggles
const wishlistLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Wishlist update rate limit reached. Please try again later.',
    code: 'WISHLIST_RATE_LIMIT'
  }
});

// Rate Limiter for Payment intents/confirms
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Payment request rate limit reached. Please try again later.',
    code: 'PAYMENT_RATE_LIMIT'
  }
});

// Rate Limiter for Orders (public checkout)
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Order submission rate limit reached. Please try again later.',
    code: 'ORDER_RATE_LIMIT'
  }
});

// Rate Limiter for Telemetry
const telemetryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Telemetry rate limit reached. Please try again later.',
    code: 'TELEMETRY_RATE_LIMIT'
  }
});

// Rate Limiter for File downloads
const fileDownloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'File download rate limit reached. Please try again later.',
    code: 'FILE_DOWNLOAD_RATE_LIMIT'
  }
});

// Helmet Security Configuration with Granular CSP
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // 'unsafe-inline' removed from scriptSrc: audited client/dist/index.html
      // and client/src — the only inline <script> in the built HTML is a
      // `type="application/ld+json"` structured-data block, which is not an
      // executable script context and is not governed by CSP script-src.
      // No inline event-handler attributes, eval(), or dangerouslySetInnerHTML
      // script injection were found in client source. If a future feature
      // needs an inline script, prefer a nonce over re-adding 'unsafe-inline'.
      scriptSrc: ["'self'"],
      // styleSrc keeps 'unsafe-inline': left as-is because React's inline
      // `style={{...}}` props (used throughout the client for dynamic
      // layout/animation values) set the element style attribute directly,
      // which CSP governs separately from stylesheet <link>/<style> tags but
      // falls back to this directive when style-src-attr isn't set. Removing
      // it without an exhaustive style-attribute audit of the client risked
      // silently breaking dynamic styling, so it was left in place per the
      // "don't guess blindly" guidance.
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "http://127.0.0.1:*"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  permittedCrossDomainPolicies: { permittedPolicies: "none" }
});

// Permissions-Policy and additional security headers middleware
function additionalSecurityHeaders(req, res, next) {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
}

// Input Sanitization to prevent XSS / Script Injection (deep: body + query + params)
function sanitizeValue(value) {
  if (typeof value === 'string') {
    // Strip dangerous HTML script/style blocks (tag + content), then strip
    // any remaining HTML tags outright. This closes the gap where a
    // non-<script> tag with an inline event-handler attribute (e.g.
    // `<img src=x onerror=alert(1)>`, `<a href="javascript:...">`) would
    // pass through a script-tag-only filter untouched — removing the tag
    // markup entirely removes the attributes along with it, while leaving
    // plain text content (product names, review prose, etc.) intact.
    return value
      .replace(/<(script|style)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    for (const key in value) {
      try {
        value[key] = sanitizeValue(value[key]);
      } catch (e) {}
    }
    return value;
  }
  return value;
}

function sanitizeInput(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      sanitizeValue(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      sanitizeValue(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      sanitizeValue(req.params);
    }
  } catch (e) {}
  next();
}

// PII Scrubbing in Console / Logs
function piiScrubbingLogger(req, res, next) {
  const start = Date.now();
  const url = req.originalUrl || req.url;
  const method = req.method;

  res.on('finish', () => {
    const duration = Date.now() - start;
    let safeIp = req.ip || req.connection.remoteAddress || 'unknown';
    // Mask last octet for privacy
    if (safeIp.includes('.')) {
      safeIp = safeIp.replace(/\.\d+$/, '.xxx');
    }
    // Only log non-static or API requests
    if (url.startsWith('/api') || url.startsWith('/ws')) {
      console.log(`[${new Date().toISOString()}] ${method} ${url} ${res.statusCode} (${duration}ms) - IP: ${safeIp}`);
    }
  });

  next();
}

module.exports = {
  apiLimiter,
  quoteUploadLimiter,
  authLimiter,
  reviewLimiter,
  newsletterLimiter,
  privacyLimiter,
  wishlistLimiter,
  paymentLimiter,
  orderLimiter,
  telemetryLimiter,
  fileDownloadLimiter,
  helmetMiddleware,
  additionalSecurityHeaders,
  sanitizeInput,
  piiScrubbingLogger
};
