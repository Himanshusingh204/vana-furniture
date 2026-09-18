const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

class FurnitureDatabase {
  constructor() {
    this.dbPath = config.DB_PATH;
    this.dataDir = path.dirname(this.dbPath);
    this.data = {
      products: [],
      quotes: [],
      orders: [],
      visitors: [],
      auditLogs: [],
      reviews: [],
      wishlist: [],
      newsletter: [],
      payments: [],
      settings: {
        factory_name: 'VANA Architectural Woodcraft',
        location: 'Basni Industrial Area Phase II, Jodhpur, Rajasthan, India',
        phone: '+91 (0291) 274-8890',
        gstin: '08AAACJ1234F1Z8',
        export_license: 'IEC-JOD-99214'
      }
    };
    this.init();
  }

  init() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(raw);
        // Phase 2 safe migration: backfill collections added after initial seed
        let migrated = false;
        for (const key of ['reviews', 'wishlist', 'newsletter', 'payments', 'visitors', 'auditLogs']) {
          if (!Array.isArray(this.data[key])) {
            const seed = require('./seed');
            this.data[key] = seed[key] || [];
            migrated = true;
          }
        }
        if (!this.data.products || this.data.products.length < 12) {
          const seed = require('./seed');
          this.data.products = seed.products;
          migrated = true;
        }
        if (migrated) this.save();
      } catch (err) {
        console.error('Failed to parse existing database file, creating fresh store', err);
        this.seedInitialData();
        this.save();
      }
    } else {
      this.seedInitialData();
      this.save();
    }
  }

  save() {
    // Synchronous atomic write (tmp + rename): re-entrant-safe on Node's
    // single thread; concurrent callers never interleave mid-write.
    try {
      const tempPath = `${this.dbPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.dbPath);
    } catch (err) {
      console.error('Database write error:', err);
    }
  }

  seedInitialData() {
    const seed = require('./seed');
    this.data.products = seed.products;
    this.data.quotes = seed.quotes;
    this.data.orders = seed.orders;
    this.data.visitors = seed.visitors;
    this.data.auditLogs = seed.auditLogs;
    this.data.reviews = seed.reviews || [];
    this.data.wishlist = seed.wishlist || [];
    this.data.newsletter = seed.newsletter || [];
    this.data.payments = seed.payments || [];
  }

  // --- Products ---
  getProducts(filter = {}) {
    let list = [...this.data.products];
    if (filter.collection && filter.collection !== 'All') {
      list = list.filter(p => p.collection.toLowerCase() === filter.collection.toLowerCase());
    }
    if (filter.wood && filter.wood !== 'All') {
      list = list.filter(p => p.wood_type.toLowerCase().includes(filter.wood.toLowerCase()));
    }
    if (filter.cadOnly === 'true' || filter.cadOnly === true) {
      list = list.filter(p => p.cad_available);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.wood_type.toLowerCase().includes(q)
      );
    }
    if (filter.sort === 'price_asc') {
      list.sort((a, b) => a.price_inr - b.price_inr);
    } else if (filter.sort === 'price_desc') {
      list.sort((a, b) => b.price_inr - a.price_inr);
    } else if (filter.sort === 'newest') {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
    return list;
  }

  getProductById(id) {
    return this.data.products.find(p => p.id === id || p.sku === id);
  }

  createProduct(productData) {
    const newProd = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sku: `JOD-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString(),
      ...productData
    };
    this.data.products.push(newProd);
    this.save();
    return newProd;
  }

  updateProduct(id, updates) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.products[idx] = { ...this.data.products[idx], ...updates, updated_at: new Date().toISOString() };
    this.save();
    return this.data.products[idx];
  }

  deleteProduct(id) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.products.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Custom CAD Quotes ---
  getQuotes() {
    return [...this.data.quotes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getQuoteById(id) {
    return this.data.quotes.find(q => q.id === id || q.quote_number === id);
  }

  createQuote(quoteData) {
    const count = this.data.quotes.length + 1;
    const quoteNumber = `CAD-JOD-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
    const newQuote = {
      id: `quote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      quote_number: quoteNumber,
      status: 'Received',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...quoteData
    };
    this.data.quotes.unshift(newQuote);
    this.logAudit('QUOTE_SUBMITTED', `New bespoke CAD quote ${quoteNumber} submitted by ${newQuote.client_name}`);
    this.save();
    return newQuote;
  }

  updateQuoteStatus(id, status, notes = '') {
    const quote = this.data.quotes.find(q => q.id === id);
    if (!quote) return null;
    quote.status = status;
    if (notes) quote.internal_engineering_notes = notes;
    quote.updated_at = new Date().toISOString();
    this.logAudit('QUOTE_STATUS_UPDATE', `Quote ${quote.quote_number} updated to status: ${status}`);
    this.save();
    return quote;
  }

  // --- Orders ---
  getOrders() {
    return [...this.data.orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getOrderById(id) {
    return this.data.orders.find(o => o.id === id || o.order_number === id);
  }

  createOrder(orderData) {
    const count = this.data.orders.length + 1;
    const orderNumber = `JOD-ORD-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
    const newOrder = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      order_number: orderNumber,
      manufacturing_stage: 'CAD & Timber Verification',
      created_at: new Date().toISOString(),
      ...orderData
    };
    this.data.orders.unshift(newOrder);
    this.logAudit('ORDER_PLACED', `Order ${orderNumber} placed for INR ${newOrder.total_inr.toLocaleString('en-IN')}`);
    this.save();
    return newOrder;
  }

  updateOrderStage(id, stage) {
    const order = this.data.orders.find(o => o.id === id);
    if (!order) return null;
    order.manufacturing_stage = stage;
    order.updated_at = new Date().toISOString();
    this.logAudit('ORDER_STAGE_UPDATE', `Order ${order.order_number} stage moved to: ${stage}`);
    this.save();
    return order;
  }

  // --- Analytics (Strictly Computed from Real Persistent Records) ---
  getRealAnalytics() {
    const totalOrders = this.data.orders.length;
    const totalRevenue = this.data.orders.reduce((sum, o) => sum + (o.total_inr || 0), 0);
    const depositsCollected = this.data.orders.reduce((sum, o) => sum + (o.deposit_paid_inr || o.total_inr || 0), 0);
    const pendingQuotes = this.data.quotes.filter(q => q.status === 'Received' || q.status === 'CAD Review').length;
    const totalCadQuotes = this.data.quotes.length;

    // Calculate conversion rate from real quotes to approved / in production
    const approvedQuotes = this.data.quotes.filter(q =>
      ['Timber Seasoning', 'CNC Milling', 'Joinery', 'Hand Finishing', 'Ready for Dispatch'].includes(q.status)
    ).length;
    const conversionRate = totalCadQuotes > 0 ? ((approvedQuotes / totalCadQuotes) * 100).toFixed(1) : 0;

    // Inventory breakdown
    const woodDistribution = {};
    this.data.products.forEach(p => {
      woodDistribution[p.wood_type] = (woodDistribution[p.wood_type] || 0) + 1;
    });

    // --- Pro analytics extensions (additive, backward compatible) ---
    // Revenue bucketed by month for the last 6 months (from real order dates)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const revenue_by_month_6m = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const revenue = this.data.orders
        .filter(o => (o.created_at || '').slice(0, 7) === key)
        .reduce((s, o) => s + (o.total_inr || 0), 0);
      revenue_by_month_6m.push({ month: monthNames[d.getMonth()], key, revenue_inr: revenue });
    }

    const orders_by_stage = {};
    this.data.orders.forEach(o => {
      const s = o.manufacturing_stage || 'Unknown';
      orders_by_stage[s] = (orders_by_stage[s] || 0) + 1;
    });

    const quotes_by_status = {};
    this.data.quotes.forEach(q => {
      const s = q.status || 'Received';
      quotes_by_status[s] = (quotes_by_status[s] || 0) + 1;
    });

    const avg_order_value_inr = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const collectionMap = {};
    this.data.products.forEach(p => {
      const c = p.collection || 'Living';
      if (!collectionMap[c]) collectionMap[c] = { collection: c, count: 0, revenue_inr: 0 };
      collectionMap[c].count += 1;
    });
    // Attribute order revenue to collections via item product lookup (best effort)
    this.data.orders.forEach(o => {
      (o.items || []).forEach(it => {
        const prod = this.data.products.find(p => p.id === it.product_id);
        const c = prod ? (prod.collection || 'Living') : 'Bespoke';
        if (!collectionMap[c]) collectionMap[c] = { collection: c, count: 0, revenue_inr: 0 };
        collectionMap[c].revenue_inr += (it.unit_price_inr || 0) * (it.quantity || 1);
      });
    });
    const top_collections = Object.values(collectionMap)
      .sort((a, b) => b.revenue_inr - a.revenue_inr || b.count - a.count)
      .slice(0, 6);

    return {
      total_revenue_inr: totalRevenue,
      deposits_collected_inr: depositsCollected,
      total_orders: totalOrders,
      total_cad_quotes: totalCadQuotes,
      pending_cad_reviews: pendingQuotes,
      active_manufacturing_jobs: this.data.orders.filter(o => o.manufacturing_stage !== 'Dispatched').length,
      quote_conversion_rate_pct: Number(conversionRate),
      wood_inventory_distribution: woodDistribution,
      revenue_by_month_6m,
      orders_by_stage,
      quotes_by_status,
      avg_order_value_inr,
      top_collections,
      last_updated: new Date().toISOString()
    };
  }

  // --- Security & Audit Logs ---
  // NOTE: in-memory push only — NO inner save(). Every mutating caller
  // (createQuote, createOrder, reviews, payments, ...) performs the single
  // save() itself, so audit entries no longer trigger a double write.
  // Standalone logAudit callers (telemetry, error handler) must call
  // db.save() explicitly after logging if persistence is required.
  logAudit(event_type, details, severity = 'INFO', ip = '127.0.0.1') {
    let safeIp = (ip || '127.0.0.1').replace(/:\d+$/, '');
    if (safeIp.includes('.')) {
      safeIp = safeIp.replace(/\.\d+$/, '.xxx');
    }
    const log = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      event_type,
      details,
      severity,
      ip: safeIp
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    return log;
  }

  getAuditLogs(limit = 50) {
    return this.data.auditLogs.slice(0, limit);
  }

  // --- Phase 2: Reviews (verified-buyer wall, admin moderated) ---
  getReviews(filter = {}) {
    let list = [...(this.data.reviews || [])];
    if (filter.product_id) list = list.filter(r => r.product_id === filter.product_id);
    if (filter.status) list = list.filter(r => r.status === filter.status);
    if (filter.featured === 'true' || filter.featured === true) list = list.filter(r => r.featured);
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list;
  }

  createReview({ product_id, buyer_name, buyer_city, rating, title, body, status }) {
    const review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: product_id || null,
      buyer_name: String(buyer_name || 'Verified Buyer').trim().slice(0, 80),
      buyer_city: String(buyer_city || 'India').trim().slice(0, 80),
      rating: Math.min(5, Math.max(1, Math.round(Number(rating)) || 5)),
      title: String(title || '').trim().slice(0, 120),
      body: String(body || '').trim().slice(0, 600),
      status: status === 'approved' || status === 'hidden' ? status : 'pending',
      featured: false,
      created_at: new Date().toISOString()
    };
    this.data.reviews.unshift(review);
    this.logAudit('REVIEW_SUBMITTED', `Review ${review.id} rated ${review.rating}/5 by ${review.buyer_name}`);
    this.save();
    return review;
  }

  moderateReview(id, { status, featured }) {
    const rev = (this.data.reviews || []).find(r => r.id === id);
    if (!rev) return null;
    if (status && ['approved', 'hidden', 'pending'].includes(status)) rev.status = status;
    if (typeof featured === 'boolean') rev.featured = featured;
    rev.updated_at = new Date().toISOString();
    this.logAudit('REVIEW_MODERATED', `Review ${id} -> ${rev.status}${rev.featured ? ' +featured' : ''}`);
    this.save();
    return rev;
  }

  deleteReview(id) {
    const idx = (this.data.reviews || []).findIndex(r => r.id === id);
    if (idx === -1) return false;
    this.data.reviews.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Phase 2: Wishlist (server sync keyed by anonymous client_key) ---
  getWishlist(client_key) {
    if (!client_key) return [];
    return (this.data.wishlist || []).filter(w => w.client_key === client_key);
  }

  toggleWishlist(client_key, product_id) {
    if (!client_key || !product_id) return null;
    const idx = (this.data.wishlist || []).findIndex(w => w.client_key === client_key && w.product_id === product_id);
    if (idx > -1) {
      this.data.wishlist.splice(idx, 1);
      this.save();
      return { added: false };
    }
    const prod = this.getProductById(product_id);
    this.data.wishlist.push({
      id: `wish-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      client_key: String(client_key).slice(0, 64),
      product_id,
      product_name: prod ? prod.name : 'Bespoke piece',
      price_inr: prod ? prod.price_inr : 0,
      created_at: new Date().toISOString()
    });
    this.save();
    return { added: true };
  }

  // --- Phase 2: Newsletter (unique email, audit logged) ---
  subscribeNewsletter(email, name = '') {
    const clean = String(email || '').trim().toLowerCase().slice(0, 160);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { error: 'Enter a valid email address.' };
    const exists = (this.data.newsletter || []).find(n => n.email === clean);
    if (exists) return { duplicate: true, entry: exists };
    const entry = {
      id: `nl-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      email: clean,
      name: String(name || '').trim().slice(0, 80),
      status: 'subscribed',
      unsubscribe_token: crypto.randomBytes(24).toString('hex'),
      created_at: new Date().toISOString(),
      unsubscribed_at: null
    };
    this.data.newsletter.unshift(entry);
    this.logAudit('NEWSLETTER_SUBSCRIBE', `Newsletter signup for ${clean.slice(0, 3)}***`);
    this.save();
    return { entry };
  }

  getNewsletter() {
    return [...(this.data.newsletter || [])];
  }

  // Marks a subscriber unsubscribed by their unique unsubscribe token
  // (soft-delete: status flag flips, record is kept for audit/history).
  unsubscribeNewsletter(token) {
    const clean = String(token || '').trim();
    if (!clean) return { error: 'Missing unsubscribe token.' };
    const entry = (this.data.newsletter || []).find(n => n.unsubscribe_token === clean);
    if (!entry) return { error: 'Unsubscribe link is invalid or has already been used.' };
    if (entry.status === 'unsubscribed') return { entry, alreadyUnsubscribed: true };
    entry.status = 'unsubscribed';
    entry.unsubscribed_at = new Date().toISOString();
    this.logAudit('NEWSLETTER_UNSUBSCRIBE', `Newsletter unsubscribe for ${entry.email.slice(0, 3)}***`);
    this.save();
    return { entry };
  }

  // --- Phase 2: Test-mode payments (provider-agnostic stub; Razorpay plugs in here) ---
  createPaymentIntent({ order_number, method, amount_inr, idempotency_key }) {
    const order = this.getOrderById(order_number);
    if (!order) return { error: 'Order not found.', status: 404 };
    // Idempotent intent creation: same key + same order reuses the first intent.
    if (idempotency_key) {
      const existing = (this.data.payments || []).find(
        (p) => p.idempotency_key === idempotency_key && p.order_number === order.order_number
      );
      if (existing) return { intent: existing, deduped: true };
    }
    const allowed = ['upi', 'card', 'netbanking', 'emi'];
    const cleanMethod = allowed.includes(method) ? method : 'upi';
    const amount = Number(amount_inr) || order.balance_due_inr || order.total_inr;
    const intent = {
      id: `pi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      provider: 'vanapay-test',
      provider_ref: `VANAPAY-TEST-${Math.floor(100000 + Math.random() * 900000)}`,
      order_id: order.id,
      order_number: order.order_number,
      method: cleanMethod,
      amount_inr: amount,
      idempotency_key: idempotency_key || undefined,
      upi_string: `upi://pay?pa=vana.atelier@okhdfc&pn=VANA%20Woodcraft&am=${amount}&cu=INR&tn=${order.order_number}`,
      status: 'created',
      created_at: new Date().toISOString()
    };
    this.data.payments.unshift(intent);
    this.logAudit('PAYMENT_INTENT_CREATED', `Test intent ${intent.provider_ref} for ${order.order_number} via ${cleanMethod}`);
    this.save();
    return { intent };
  }

  confirmPayment(intent_id, opts = {}) {
    const key = (opts && (opts.idempotency_key || opts.provider_ref)) || undefined;
    const intent = (this.data.payments || []).find(
      (p) => p.id === intent_id || p.provider_ref === intent_id || (key && (p.idempotency_key === key || p.provider_ref === key))
    );
    if (!intent) return { error: 'Payment intent not found.', status: 404 };
    if (intent.status === 'paid') return { intent };
    intent.status = 'paid';
    intent.paid_at = new Date().toISOString();
    const order = this.data.orders.find(o => o.id === intent.order_id);
    if (order) {
      order.payment_status = 'Paid in Full (Test Mode)';
      order.deposit_paid_inr = order.total_inr;
      order.balance_due_inr = 0;
      order.updated_at = new Date().toISOString();
    }
    this.logAudit('PAYMENT_CONFIRMED', `Test payment ${intent.provider_ref} confirmed for ${intent.order_number}`);
    this.save();
    return { intent, order };
  }

  getPayments() {
    return [...(this.data.payments || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

module.exports = new FurnitureDatabase();
