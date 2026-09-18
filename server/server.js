const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const config = require('./config');
const wsHub = require('./wsHub');
const db = require('./db/database');
const { fail } = require('./utils/respond');
const {
  apiLimiter,
  helmetMiddleware,
  additionalSecurityHeaders,
  sanitizeInput,
  piiScrubbingLogger
} = require('./middleware/security');

// Route modules
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const quoteRoutes = require('./routes/quotes');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');
const telemetryRoutes = require('./routes/telemetry');
const reviewRoutes = require('./routes/reviews');
const wishlistRoutes = require('./routes/wishlist');
const newsletterRoutes = require('./routes/newsletter');
const paymentRoutes = require('./routes/payments');
const privacyRoutes = require('./routes/privacy');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket Gateway
wsHub.init(server);

// HTTPS enforcement (production only). This app typically runs behind a
// platform proxy/load balancer (Render, Railway, Fly.io, Koyeb, etc.), which
// terminates TLS and forwards plain HTTP internally — so `req.secure` alone
// is unreliable there; `x-forwarded-proto` is what the proxy sets to tell us
// the original scheme. Helmet does not perform this redirect itself.
function httpsRedirect(req, res, next) {
  if (config.NODE_ENV !== 'production') return next();
  const forwardedProto = req.headers['x-forwarded-proto'];
  const isSecure = req.secure || forwardedProto === 'https';
  if (isSecure) return next();
  // Health checks from the hosting platform itself often hit the server
  // over plain HTTP internally; don't redirect those into a loop.
  if (req.path === '/api/health') return next();
  return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
}

// Defensive Middleware Stack
app.use(httpsRedirect);
app.use(helmetMiddleware);
app.use(additionalSecurityHeaders);
app.use(cors({
  origin: function (origin, callback) {
    // Allow local development and mobile/curl/testing
    if (!origin || config.ALLOWED_ORIGINS.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else if (config.NODE_ENV === 'production') {
      callback(new Error('CORS blocked'));
    } else {
      callback(null, true); // Permissive in dev/container; origin can be tightened via env
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);
app.use(piiScrubbingLogger);

// Global Health Check (Crucial for hosting platforms: Render, Railway, Fly.io, Koyeb)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'VANA Architectural Woodcraft & CAD Works',
    facility: 'Basni Phase II, Jodhpur, Rajasthan',
    uptime_seconds: Math.floor(process.uptime()),
    database: 'active_transactional_store',
    active_websockets: wsHub.getActiveVisitorCount(),
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes with Rate Limiting
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/users', userRoutes);

// Static CAD Samples directory for demonstration CAD downloads
const cadSamplesDir = path.join(__dirname, 'public', 'cad');
if (!fs.existsSync(cadSamplesDir)) {
  fs.mkdirSync(cadSamplesDir, { recursive: true });
}

// Generate sample CAD specification files if they don't exist
const sampleCadFiles = [
  'sample-marwar-monolith.dwg',
  'sample-marwar-monolith.dxf',
  'sample-marwar-monolith.step',
  'sample-basni-chair.dwg',
  'sample-basni-chair.step',
  'sample-credenza.dwg',
  'sample-credenza.step',
  'sample-desk.dwg',
  'sample-desk.step',
  'sample-canopy-bed.dwg',
  'sample-canopy-bed.step',
  'sample-bench.dwg',
  'sample-bench.step'
];

sampleCadFiles.forEach(file => {
  const filePath = path.join(cadSamplesDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
      filePath,
      `/* VANA ARCHITECTURAL WOODCRAFT - BASNI FACTORY SPECIFICATION */\n` +
      `/* Model: ${file} */\n` +
      `/* Timber: Kiln-Seasoned Sheesham / Teak (Moisture 8.4%) */\n` +
      `/* Machine: 5-Axis CNC Homag Toolpath Compatible */\n` +
      `/* Tolerance: +/- 0.18 mm */\n` +
      `HEADER SECTION;\n` +
      `FILE_DESCRIPTION(('CAD Architectural Furniture Drawing', 'Version 2.4'), '2;1');\n` +
      `ENDSEC;\n`
    );
  }
});
app.use('/cad', express.static(cadSamplesDir));

// Product image uploads served at /uploads
const productUploadsDir = path.join(__dirname, 'uploads', 'products');
if (!fs.existsSync(productUploadsDir)) {
  fs.mkdirSync(productUploadsDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Production Client Serving (if built in client/dist)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/cad') || req.url.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Requested API endpoint does not exist on this atelier server' });
});

// CORS rejection (strict production mode) -> 403, not a 500
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.message === 'CORS blocked') {
    return fail(res, 403, 'Origin not permitted by atelier CORS policy.', 'CORS_BLOCKED');
  }
  next(err);
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err.statusCode === 400) {
    return fail(res, 400, 'Malformed JSON payload received.', 'INVALID_JSON');
  }
  console.error('[UNCAUGHT SERVER ERROR]', err);
  db.logAudit('SERVER_INTERNAL_ERROR', err.message || 'Uncaught error', 'ERROR', req.ip);
  db.save();
  const incident_time = new Date().toISOString();
  return res.status(500).json({ success: false, error: 'Internal factory server error. An incident has been logged for engineering review.', code: 'INTERNAL_ERROR', incident_time: incident_time, details: { incident_time: incident_time } });
});

// Start Server
const PORT = config.PORT;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('\n\x1b[31m%s\x1b[0m', `[FATAL] Port ${PORT} is already in use by another running process.`);
    console.error('\x1b[33m%s\x1b[0m', `Tip: Close the competing instance or run start.bat / start-dev.bat which automatically frees port ${PORT}.\n`);
    process.exit(1);
  } else {
    console.error('\x1b[31m[SERVER ERROR]\x1b[0m', err);
    process.exit(1);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n\x1b[32m%s\x1b[0m', '═══════════════════════════════════════════════════════════════');
  console.log('\x1b[33m%s\x1b[0m', `  VANA ARCHITECTURAL WOODCRAFT & CAD ATELIER SERVER: PORT ${PORT} `);
  console.log('\x1b[36m%s\x1b[0m', `  Health Endpoint: http://localhost:${PORT}/api/health         `);
  console.log('\x1b[36m%s\x1b[0m', `  WebSocket Hub:   ws://localhost:${PORT}                     `);
  console.log('\x1b[32m%s\x1b[0m', '═══════════════════════════════════════════════════════════════\n');
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP and WebSocket connections...');
  server.close(() => {
    console.log('Server process terminated gracefully.');
  });
});
