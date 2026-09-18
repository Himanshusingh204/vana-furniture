import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import SEO from '../components/SEO';
import OverviewCards from '../components/admin/OverviewCards';
import AnalyticsPro from '../components/admin/AnalyticsPro';
import ProductTable from '../components/admin/ProductTable';
import ProductEditor from '../components/admin/ProductEditor';
import OrdersPanel from '../components/admin/OrdersPanel';
import QuotesPanel from '../components/admin/QuotesPanel';
import {
  ShieldCheck,
  Cpu,
  Package,
  Layers,
  Lock,
  RefreshCw,
  Plus,
  Star,
  Mail,
  CreditCard,
  Download
} from 'lucide-react';

export default function AdminDashboard() {
  const { activeVisitors, connected, lastNotification, lastProductUpdate } = useSocket();

  // Authentication State
  // Canonical key: vana_admin_token. Legacy jodhpur_admin_token still read as
  // fallback (and dual-written on login) so older sessions keep working.
  const readStoredToken = () => {
    try {
      return sessionStorage.getItem('vana_admin_token')
        || sessionStorage.getItem('jodhpur_admin_token')
        || '';
    } catch (e) {
      return '';
    }
  };
  const [token, setToken] = useState(readStoredToken);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard Data State
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [products, setProducts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  // Phase 2: engagement + revenue ledger
  const [reviews, setReviews] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'quotes' | 'products' | 'reviews' | 'newsletter' | 'payments' | 'security'
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  // Per-resource fetch errors so one failing card doesn't blank the console.
  const [resourceErrors, setResourceErrors] = useState({});
  // User-visible mutation feedback (replaces console.error-only handling).
  const [actionError, setActionError] = useState('');
  const [actionOk, setActionOk] = useState('');

  // Product editing State
  const [editingProduct, setEditingProduct] = useState(null);

  // New Product Modal
  const [showNewProdModal, setShowNewProdModal] = useState(false);
  const [newProd, setNewProd] = useState({
    name: '',
    collection: 'Living',
    wood_type: 'Seasoned Sheesham',
    price_inr: 120000,
    dimensions_display: '2000 x 900 x 750 mm',
    description: '',
    lead_time_weeks: 4
  });

  // Login handler
  const expireSession = () => {
    setToken('');
    try {
      sessionStorage.removeItem('vana_admin_token');
      sessionStorage.removeItem('jodhpur_admin_token');
    } catch (e) {}
    setSessionExpired(true);
    setRefreshing(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setSessionExpired(false);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication rejected');

      setToken(data.token);
      try {
        sessionStorage.setItem('vana_admin_token', data.token);
        sessionStorage.setItem('jodhpur_admin_token', data.token); // legacy back-compat
      } catch (e) {}
    } catch (err) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    try {
      sessionStorage.removeItem('vana_admin_token');
      sessionStorage.removeItem('jodhpur_admin_token');
    } catch (e) {}
  };

  // Load Dashboard Data strictly from real DB records.
  // Per-resource fetchers so WS invalidations can reload one card only.
  const loadResource = async (key) => {
    const headers = { Authorization: `Bearer ${token}` };
    switch (key) {
      case 'analytics': {
        const res = await fetch('/api/analytics', { headers });
        if (res.status === 401 || res.status === 403) { expireSession(); throw new Error('Session expired'); }
        if (!res.ok) throw new Error(`Analytics (${res.status})`);
        const json = await res.json();
        setAnalytics(json.data);
        return;
      }
      case 'orders': {
        const res = await fetch('/api/orders', { headers });
        if (!res.ok) throw new Error(`Orders (${res.status})`);
        const json = await res.json();
        setOrders(json.data || []);
        return;
      }
      case 'quotes': {
        const res = await fetch('/api/quotes', { headers });
        if (!res.ok) throw new Error(`Quotes (${res.status})`);
        const json = await res.json();
        setQuotes(json.data || []);
        return;
      }
      case 'products': {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error(`Products (${res.status})`);
        const json = await res.json();
        setProducts(json.data || []);
        return;
      }
      case 'logs': {
        const res = await fetch('/api/analytics/audit-logs', { headers });
        if (!res.ok) throw new Error(`Audit logs (${res.status})`);
        const json = await res.json();
        setAuditLogs(json.data || []);
        return;
      }
      case 'reviews': {
        const res = await fetch('/api/reviews/all', { headers });
        if (!res.ok) throw new Error(`Reviews (${res.status})`);
        const json = await res.json();
        setReviews(json.data || []);
        return;
      }
      case 'newsletter': {
        const res = await fetch('/api/newsletter', { headers });
        if (!res.ok) throw new Error(`Newsletter (${res.status})`);
        const json = await res.json();
        setSubscribers(json.data || []);
        return;
      }
      case 'payments': {
        const res = await fetch('/api/payments', { headers });
        if (!res.ok) throw new Error(`Payments (${res.status})`);
        const json = await res.json();
        setPayments(json.data || []);
        return;
      }
      default:
        return;
    }
  };

  const RESOURCE_KEYS = ['analytics', 'orders', 'quotes', 'products', 'logs', 'reviews', 'newsletter', 'payments'];

  const loadData = async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const results = await Promise.allSettled(RESOURCE_KEYS.map((k) => loadResource(k)));
      const errs = {};
      results.forEach((r, i) => {
        if (r.status === 'rejected') errs[RESOURCE_KEYS[i]] = r.reason?.message || 'Failed to load';
      });
      setResourceErrors(errs);
      const failed = Object.keys(errs);
      setLoadError(failed.length === RESOURCE_KEYS.length
        ? 'Failed to load dashboard data'
        : failed.length > 0
          ? `Some sections failed to load: ${failed.join(', ')}`
          : '');
    } catch (err) {
      console.error('Failed to load admin data', err);
      setLoadError('Failed to load dashboard data');
    } finally {
      setRefreshing(false);
    }
  };

  // Targeted WS invalidation: reload only the affected resource card(s).
  const reloadForNotification = async (type) => {
    if (!type) return;
    const t = String(type).toUpperCase();
    if (t.startsWith('ORDER_')) return loadResource('orders').catch((e) => setResourceErrors((p) => ({ ...p, orders: e.message })));
    if (t.includes('QUOTE')) return loadResource('quotes').catch((e) => setResourceErrors((p) => ({ ...p, quotes: e.message })));
    if (t.includes('REVIEW')) return loadResource('reviews').catch((e) => setResourceErrors((p) => ({ ...p, reviews: e.message })));
    if (t.includes('PAYMENT')) return loadResource('payments').catch((e) => setResourceErrors((p) => ({ ...p, payments: e.message })));
    if (t.includes('PRODUCT')) {
      try { await loadResource('products'); } catch (e) { setResourceErrors((p) => ({ ...p, products: e.message })); }
      return;
    }
    return loadData();
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (token && lastNotification?.type) {
      reloadForNotification(lastNotification.type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastNotification]); // Auto-refresh only the affected card on WS events

  useEffect(() => {
    if (token && lastProductUpdate?.type) {
      loadResource('products').catch((e) => setResourceErrors((p) => ({ ...p, products: e.message })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastProductUpdate]); // Catalog refetch on PRODUCT_CREATED/UPDATED/DELETED

  // Hidden keyboard shortcut: Ctrl+Shift+A to access admin
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        window.location.href = '/admin';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update Order Stage
  const updateOrderStage = async (orderId, newStage) => {
    setActionError('');
    setActionOk('');
    try {
      const res = await fetch(`/api/orders/${orderId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stage: newStage })
      });
      if (res.ok) {
        setActionOk(`Order stage moved to ${newStage}.`);
        loadResource('orders').catch(() => {});
      } else {
        const j = await res.json().catch(() => ({}));
        setActionError(j.error || `Could not move order stage (HTTP ${res.status}).`);
      }
    } catch (e) {
      console.error('Error updating order stage', e);
      setActionError(e.message || 'Could not move order stage. Check connection and retry.');
    }
  };

  // Update Quote Status
  const updateQuoteStatus = async (quoteId, newStatus) => {
    setActionError('');
    setActionOk('');
    try {
      const res = await fetch(`/api/quotes/${quoteId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setActionOk(`Quote moved to ${newStatus}.`);
        loadResource('quotes').catch(() => {});
      } else {
        const j = await res.json().catch(() => ({}));
        setActionError(j.error || `Could not update quote status (HTTP ${res.status}).`);
      }
    } catch (e) {
      console.error('Error updating quote status', e);
      setActionError(e.message || 'Could not update quote status. Check connection and retry.');
    }
  };

  // Create Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionOk('');
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newProd,
          stock_status: 'Made-to-Order',
          cad_available: true,
          three_config: {
            model_type: 'dining_table',
            default_finish: 'sheesham_natural',
            available_finishes: ['sheesham_natural', 'teak_honey']
          }
        })
      });
      if (res.ok) {
        setShowNewProdModal(false);
        setNewProd({
          name: '',
          collection: 'Living',
          wood_type: 'Seasoned Sheesham',
          price_inr: 120000,
          dimensions_display: '2000 x 900 x 750 mm',
          description: '',
          lead_time_weeks: 4
        });
        setActionOk('Piece published to the factory catalog.');
        loadResource('products').catch(() => {});
      } else {
        const j = await res.json().catch(() => ({}));
        setActionError(j.error || `Could not publish piece (HTTP ${res.status}).`);
      }
    } catch (e) {
      console.error('Error creating product', e);
      setActionError(e.message || 'Could not publish piece. Check connection and retry.');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this piece from the factory catalog?')) return;
    setActionError('');
    setActionOk('');
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActionOk('Piece removed from the catalog.');
        loadResource('products').catch(() => {});
      } else {
        const j = await res.json().catch(() => ({}));
        setActionError(j.error || `Could not remove piece (HTTP ${res.status}).`);
      }
    } catch (e) {
      console.error('Error deleting product', e);
      setActionError(e.message || 'Could not remove piece. Check connection and retry.');
    }
  };

  const handleProductSaved = (saved) => {
    setProducts((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
    setEditingProduct(null);
    setActionOk('Piece saved.');
    loadResource('products').catch(() => {});
  };

  // Phase 2: review moderation + subscriber CSV export
  const moderateReview = async (id, patch) => {
    setActionError('');
    setActionOk('');
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch)
      });
      if (res.ok) {
        loadResource('reviews').catch(() => {});
      } else {
        const j = await res.json().catch(() => ({}));
        setActionError(j.error || `Could not moderate review (HTTP ${res.status}).`);
      }
    } catch (e) {
      console.error('Error moderating review', e);
      setActionError(e.message || 'Could not moderate review. Check connection and retry.');
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Hide this review permanently?')) return;
    setActionError('');
    setActionOk('');
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadResource('reviews').catch(() => {});
      } else {
        const j = await res.json().catch(() => ({}));
        setActionError(j.error || `Could not delete review (HTTP ${res.status}).`);
      }
    } catch (e) {
      console.error('Error deleting review', e);
      setActionError(e.message || 'Could not delete review. Check connection and retry.');
    }
  };

  const exportCsv = (name, rows) => {
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 1. LOGIN SCREEN IF UNAUTHENTICATED
  if (!token) {
    return (
      <div className="section container" style={{ maxWidth: '520px', paddingTop: '5rem' }}>
        <SEO title="Factory Admin Login | VANA" />
        <div className="card-luxury" style={{ textAlign: 'center', padding: '3rem 2.5rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--accent-gold-subtle)',
              color: 'var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}
          >
            <Lock size={28} />
          </div>

          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>Basni Operations Console</h2>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-gold)' }}>
            Authorized Engineering & Owner Portal
          </span>

          {sessionExpired && (
            <div
              style={{
                padding: '0.6rem 0.8rem',
                background: 'rgba(251, 191, 36, 0.12)',
                border: '1px solid var(--warning)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--warning)',
                fontSize: '0.82rem',
                marginTop: '1.5rem',
                textAlign: 'left'
              }}
            >
              Session expired after 1 hour. Please log in again.
            </div>
          )}

          <form onSubmit={handleLogin} style={{ marginTop: '2rem', textAlign: 'left' }}>
            <div className="form-group">
              <label className="form-label">Authorized Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="input-luxury"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Security Keyphrase / Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="input-luxury"
              />
            </div>

            {authError && (
              <div
                style={{
                  padding: '0.6rem 0.8rem',
                  background: 'rgba(248, 113, 113, 0.15)',
                  border: '1px solid var(--danger)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--danger)',
                  fontSize: '0.82rem',
                  marginBottom: '1rem'
                }}
              >
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {authLoading ? 'Verifying credentials…' : 'Access Operations Console'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Protected by Argon2/Bcrypt &bull; Anti-Brute Force Lockout &bull; Basni Plant II
          </div>
          {/* Hidden admin access hint */}
          <div
            title="Ctrl+Shift+A"
            style={{ marginTop: '0.5rem', fontSize: '0.5rem', color: 'transparent', cursor: 'default', userSelect: 'none' }}
          >
            .
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED DASHBOARD
  return (
    <div className="section" style={{ paddingTop: '2rem' }}>
      <SEO title="Basni Factory Operations & Live Telemetry Center | VANA" />
      <div className="container">
        {/* Header Bar */}
        <div className="admin-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                className="pulse-live"
                title={connected ? 'Socket connected' : 'Socket disconnected'}
                style={{ background: connected ? undefined : 'var(--danger)', opacity: connected ? 1 : 0.7 }}
              />
              <h1 style={{ fontSize: '2rem' }}>Basni Factory Operations Console</h1>
            </div>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-gold)' }}>
              Real-Time Production Telemetry &bull; Persistent SQLite Store
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <button onClick={loadData} className="btn btn-secondary" style={{ padding: '0.6rem 1rem' }} title="Sync Database">
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh Data
            </button>
            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.6rem 1rem' }}>
              Lock & Log Out
            </button>
          </div>
        </div>

        {/* Real-Time Database Metrics Cards */}
        <OverviewCards
          stats={analytics}
          loading={refreshing}
          error={loadError || resourceErrors.analytics || ''}
          productCount={products.length}
          activeVisitors={activeVisitors}
        />

        {/* Mutation feedback: user-visible toast/alert (not console-only) */}
        {actionError && (
          <div role="alert" style={{ marginBottom: '1rem', padding: '0.7rem 1rem', background: 'rgba(248,113,113,0.12)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem' }}>
            {actionError}
          </div>
        )}
        {actionOk && (
          <div role="status" style={{ marginBottom: '1rem', padding: '0.7rem 1rem', background: 'rgba(52,211,153,0.10)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '0.85rem' }}>
            {actionOk}
          </div>
        )}

        {/* Professional analytics: KPIs, revenue trend, funnels, mix, export */}
        <AnalyticsPro
          analytics={analytics}
          orders={orders}
          quotes={quotes}
          products={products}
          activeVisitors={activeVisitors}
        />

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button
            onClick={() => setActiveTab('orders')}
            className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          >
            <Package size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Factory Commission Work Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`admin-tab-btn ${activeTab === 'quotes' ? 'active' : ''}`}
          >
            <Cpu size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Custom CAD Blueprint Inquiries ({quotes.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          >
            <Layers size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Catalog & 3D Configs ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`admin-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          >
            <Star size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('newsletter')}
            className={`admin-tab-btn ${activeTab === 'newsletter' ? 'active' : ''}`}
          >
            <Mail size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Newsletter ({subscribers.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`admin-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          >
            <CreditCard size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Payments ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`admin-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          >
            <ShieldCheck size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Security & Telemetry Logs ({auditLogs.length})
          </button>
        </div>

        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <OrdersPanel data={orders} loading={refreshing} error={resourceErrors.orders || ''} onStageChange={updateOrderStage} />
        )}

        {/* TAB 2: CUSTOM CAD BLUEPRINTS & INQUIRIES */}
        {activeTab === 'quotes' && (
          <QuotesPanel data={quotes} loading={refreshing} error={resourceErrors.quotes || ''} onStatusChange={updateQuoteStatus} />
        )}

        {/* TAB 3: PRODUCTS & 3D CONFIGS */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setShowNewProdModal(true)}
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.25rem' }}
              >
                <Plus size={16} /> Add Architectural Piece
              </button>
            </div>

            <ProductTable
              products={products}
              onEdit={setEditingProduct}
              onDelete={handleDeleteProduct}
              loading={refreshing}
              error={resourceErrors.products || ''}
            />
          </div>
        )}

        {/* TAB 4: REVIEWS MODERATION */}
        {activeTab === 'reviews' && (
          <div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Approve, feature on the homepage wall, hide or delete. New submissions arrive approved and broadcast live.
            </div>
            {reviews.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No reviews yet.</div>}
            {reviews.map((r) => (
              <div key={r.id} className="analytics-pro-card" style={{ marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <strong>{r.title || 'Untitled'}</strong>
                    <span className="badge badge-gold" style={{ marginLeft: '0.6rem' }}>{r.rating}/5 · {r.status}{r.featured ? ' · Featured' : ''}</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                      {r.buyer_name} · {r.buyer_city} · {r.product_id || 'site-wide'}
                    </div>
                    <div style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>{r.body}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.75rem' }} onClick={() => moderateReview(r.id, { status: r.status === 'approved' ? 'hidden' : 'approved' })}>
                      {r.status === 'approved' ? 'Hide' : 'Approve'}
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.75rem' }} onClick={() => moderateReview(r.id, { featured: !r.featured })}>
                      {r.featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.45rem 0.9rem', fontSize: '0.75rem' }} onClick={() => deleteReview(r.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: NEWSLETTER SUBSCRIBERS */}
        {activeTab === 'newsletter' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Owner-only list. Export for your mail tool; never share publicly.
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.55rem 1rem', fontSize: '0.75rem' }}
                onClick={() => exportCsv('vana-newsletter.csv', [['email', 'name', 'subscribed_at'], ...subscribers.map((s) => [s.email, s.name, s.created_at])])}
              >
                <Download size={14} /> Subscribers CSV
              </button>
            </div>
            {subscribers.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No subscribers yet. The homepage block feeds this list.</div>}
            {subscribers.map((s) => (
              <div key={s.id} className="funnel-row">
                <span className="funnel-label" title={s.email} style={{ width: '260px', flexBasis: '260px' }}>{s.email}</span>
                <span className="funnel-label">{s.name || '—'}</span>
                <span className="funnel-val" style={{ width: 'auto' }}>{s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN') : ''}</span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: PAYMENT LEDGER (TEST MODE) */}
        {activeTab === 'payments' && (
          <div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Test-mode intents from the tracking page. Swap <strong>vanapay-test</strong> for Razorpay keys when ready — same shape.
            </div>
            {payments.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No payments yet. Complete a test payment from any tracking page.</div>}
            {payments.map((p) => (
              <div key={p.id} className="funnel-row">
                <span className="funnel-label" title={p.provider_ref}>{p.provider_ref}</span>
                <span className="funnel-label">{p.order_number} · {p.method}</span>
                <span className="funnel-label">{p.status}{p.paid_at ? ` · ${new Date(p.paid_at).toLocaleDateString('en-IN')}` : ''}</span>
                <span className="funnel-val" style={{ width: 'auto' }}>₹{(p.amount_inr || 0).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 7: SECURITY AUDIT & ERROR TELEMETRY */}
        {activeTab === 'security' && (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Live Stream of Defensive Events, Failed Logins, and Client UI Exceptions:
              </div>
              <span className="badge badge-gold">
                <ShieldCheck size={12} /> PII Masked
              </span>
            </div>

            <div className="admin-audit-stream">
              {auditLogs.map((log) => (
                <div key={log.id} className={`admin-audit-entry ${log.severity}`}>
                  <span style={{ color: '#888' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span style={{ fontWeight: 700 }}>[{log.event_type}]</span>
                  <span>{log.details}</span>
                  <span style={{ marginLeft: 'auto', color: '#666' }}>IP: {log.ip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: EDIT PRODUCT */}
        {editingProduct && (
          <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Edit {editingProduct.name}</h3>
              <ProductEditor
                product={editingProduct}
                token={token}
                onSaved={handleProductSaved}
                onCancel={() => setEditingProduct(null)}
              />
            </div>
          </div>
        )}

        {/* MODAL: ADD PRODUCT */}
        {showNewProdModal && (
          <div className="modal-overlay" onClick={() => setShowNewProdModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Add Bespoke Architectural Piece</h3>
              <form onSubmit={handleCreateProduct}>
                <div className="form-group">
                  <label className="form-label">Piece Name *</label>
                  <input
                    type="text"
                    required
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    placeholder="The Thar Executive Desk"
                    className="input-luxury"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Collection</label>
                    <select
                      value={newProd.collection}
                      onChange={(e) => setNewProd({ ...newProd, collection: e.target.value })}
                      className="select-luxury"
                    >
                      <option value="Living">Living</option>
                      <option value="Dining">Dining</option>
                      <option value="Executive Study">Executive Study</option>
                      <option value="Bedroom">Bedroom</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Timber Species</label>
                    <select
                      value={newProd.wood_type}
                      onChange={(e) => setNewProd({ ...newProd, wood_type: e.target.value })}
                      className="select-luxury"
                    >
                      <option value="Seasoned Sheesham">Seasoned Sheesham</option>
                      <option value="Royal Jodhpur Teak">Royal Jodhpur Teak</option>
                      <option value="Reclaimed Acacia">Reclaimed Acacia</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Price in INR *</label>
                    <input
                      type="number"
                      required
                      value={newProd.price_inr}
                      onChange={(e) => setNewProd({ ...newProd, price_inr: Number(e.target.value) })}
                      className="input-luxury"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lead Time (Weeks)</label>
                    <input
                      type="number"
                      value={newProd.lead_time_weeks}
                      onChange={(e) => setNewProd({ ...newProd, lead_time_weeks: Number(e.target.value) })}
                      className="input-luxury"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Outer Dimensions (Display)</label>
                  <input
                    type="text"
                    value={newProd.dimensions_display}
                    onChange={(e) => setNewProd({ ...newProd, dimensions_display: e.target.value })}
                    placeholder="2200 x 950 x 760 mm"
                    className="input-luxury"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Architectural Description</label>
                  <textarea
                    value={newProd.description}
                    onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                    placeholder="Precision milled solid Sheesham with concealed cable runs..."
                    className="textarea-luxury"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowNewProdModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Publish to Factory Catalog
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
