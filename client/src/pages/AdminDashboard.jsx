import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import OverviewCards from '../components/admin/OverviewCards';
import AnalyticsPro from '../components/admin/AnalyticsPro';
import ProductTable from '../components/admin/ProductTable';
import ProductEditor from '../components/admin/ProductEditor';
import OrdersPanel from '../components/admin/OrdersPanel';
import QuotesPanel from '../components/admin/QuotesPanel';
import ReviewsPanel from '../components/admin/ReviewsPanel';
import NewsletterPanel from '../components/admin/NewsletterPanel';
import PaymentsPanel from '../components/admin/PaymentsPanel';
import SecurityPanel from '../components/admin/SecurityPanel';
import UsersPanel from '../components/admin/UsersPanel';
import {
  ShieldCheck,
  Cpu,
  Package,
  Layers,
  Lock,
  LogOut,
  RefreshCw,
  Plus,
  Star,
  Mail,
  CreditCard,
  Users
} from 'lucide-react';

export default function AdminDashboard() {
  const { activeVisitors, connected, lastNotification, lastProductUpdate } = useSocket();
  const {
    token,
    user,
    sessionExpired,
    authLoading,
    authError,
    login,
    logout,
    expireSession
  } = useAuth();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

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
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'quotes' | 'products' | 'reviews' | 'newsletter' | 'payments' | 'security' | 'users'
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  // Per-resource fetch errors so one failing card doesn't blank the console.
  const [resourceErrors, setResourceErrors] = useState({});
  // User-visible mutation feedback (replaces console.error-only handling).
  const [actionError, setActionError] = useState('');
  const [actionOk, setActionOk] = useState('');

  // Product editing State
  const [editingProduct, setEditingProduct] = useState(null);
  const [showNewProdModal, setShowNewProdModal] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      // authError is already set by the context; nothing further to do here.
    }
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
        const res = await fetch('/api/products', { headers });
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
      case 'users': {
        if (!isAdmin) return;
        const res = await fetch('/api/users', { headers });
        if (!res.ok) throw new Error(`Users (${res.status})`);
        const json = await res.json();
        setUsers(json.data || []);
        return;
      }
      default:
        return;
    }
  };

  const RESOURCE_KEYS = ['analytics', 'orders', 'quotes', 'products', 'logs', 'reviews', 'newsletter', 'payments', 'users'];

  const loadData = async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const keys = RESOURCE_KEYS.filter((k) => k !== 'users' || isAdmin);
      const results = await Promise.allSettled(keys.map((k) => loadResource(k)));
      const errs = {};
      results.forEach((r, i) => {
        if (r.status === 'rejected') errs[keys[i]] = r.reason?.message || 'Failed to load';
      });
      setResourceErrors(errs);
      const failed = Object.keys(errs);
      setLoadError(failed.length === keys.length
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
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
    });
    setEditingProduct(null);
    setShowNewProdModal(false);
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

  // Users management (admin-only tab; API being built in parallel — see UsersPanel)
  const createUser = async (payload) => {
    setActionError('');
    setActionOk('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || `Could not create user (HTTP ${res.status}).`);
    setActionOk('User added.');
    loadResource('users').catch(() => {});
  };

  const patchUser = async (email, patch) => {
    setActionError('');
    setActionOk('');
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch)
      });
      if (res.ok) {
        setActionOk('User updated.');
        loadResource('users').catch(() => {});
      } else {
        const j = await res.json().catch(() => ({}));
        setActionError(j.error || `Could not update user (HTTP ${res.status}).`);
      }
    } catch (e) {
      console.error('Error updating user', e);
      setActionError(e.message || 'Could not update user. Check connection and retry.');
    }
  };

  const deleteUser = async (email) => {
    setActionError('');
    setActionOk('');
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActionOk('User removed.');
        loadResource('users').catch(() => {});
      } else {
        const j = await res.json().catch(() => ({}));
        setActionError(j.error || `Could not remove user (HTTP ${res.status}).`);
      }
    } catch (e) {
      console.error('Error deleting user', e);
      setActionError(e.message || 'Could not remove user. Check connection and retry.');
    }
  };

  // 1. LOGIN SCREEN IF UNAUTHENTICATED
  if (!token) {
    return (
      <div className="section container" style={{ maxWidth: '520px', paddingTop: '5rem' }}>
        <SEO title="Factory Admin Login | VANA" />
        <div className="card-luxury" style={{ textAlign: 'center', padding: '3rem 2.5rem' }}>
          <div className="admin-login-icon">
            <Lock size={28} aria-hidden="true" />
          </div>

          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>Basni Operations Console</h2>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-gold)' }}>
            Authorized Engineering & Owner Portal
          </span>

          {sessionExpired && (
            <div className="admin-login-alert warning" role="alert">
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
              <div className="admin-login-alert danger" role="alert">
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
              Real-Time Production Telemetry &bull; Persistent JSON Store
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <button onClick={loadData} className="btn btn-secondary" style={{ padding: '0.6rem 1rem' }} title="Sync Database">
              <RefreshCw size={16} aria-hidden="true" className={refreshing ? 'animate-spin' : ''} /> Refresh Data
            </button>
            <button onClick={logout} className="btn btn-outline" style={{ padding: '0.6rem 1rem' }}>
              <LogOut size={16} aria-hidden="true" /> Lock & Log Out
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
          <div role="alert" className="admin-feedback danger">
            {actionError}
          </div>
        )}
        {actionOk && (
          <div role="status" className="admin-feedback success">
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
        <div className="admin-tabs" role="tablist" aria-label="Operations console sections">
          <button
            onClick={() => setActiveTab('orders')}
            className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'orders'}
          >
            <Package size={16} aria-hidden="true" />
            Factory Commission Work Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`admin-tab-btn ${activeTab === 'quotes' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'quotes'}
          >
            <Cpu size={16} aria-hidden="true" />
            Custom CAD Blueprint Inquiries ({quotes.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'products'}
          >
            <Layers size={16} aria-hidden="true" />
            Catalog & 3D Configs ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`admin-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'reviews'}
          >
            <Star size={16} aria-hidden="true" />
            Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('newsletter')}
            className={`admin-tab-btn ${activeTab === 'newsletter' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'newsletter'}
          >
            <Mail size={16} aria-hidden="true" />
            Newsletter ({subscribers.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`admin-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'payments'}
          >
            <CreditCard size={16} aria-hidden="true" />
            Payments ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`admin-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'security'}
          >
            <ShieldCheck size={16} aria-hidden="true" />
            Security & Telemetry Logs ({auditLogs.length})
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'users'}
            >
              <Users size={16} aria-hidden="true" />
              Users ({users.length})
            </button>
          )}
        </div>

        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="admin-tab-content" role="tabpanel" key="orders">
            <OrdersPanel data={orders} loading={refreshing} error={resourceErrors.orders || ''} onStageChange={updateOrderStage} />
          </div>
        )}

        {/* TAB 2: CUSTOM CAD BLUEPRINTS & INQUIRIES */}
        {activeTab === 'quotes' && (
          <div className="admin-tab-content" role="tabpanel" key="quotes">
            <QuotesPanel data={quotes} loading={refreshing} error={resourceErrors.quotes || ''} onStatusChange={updateQuoteStatus} />
          </div>
        )}

        {/* TAB 3: PRODUCTS & 3D CONFIGS */}
        {activeTab === 'products' && (
          <div className="admin-tab-content" role="tabpanel" key="products">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setShowNewProdModal(true)}
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.25rem' }}
              >
                <Plus size={16} aria-hidden="true" /> Add Architectural Piece
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
          <div className="admin-tab-content" role="tabpanel" key="reviews">
            <ReviewsPanel data={reviews} loading={refreshing} error={resourceErrors.reviews || ''} onModerate={moderateReview} onDelete={deleteReview} />
          </div>
        )}

        {/* TAB 5: NEWSLETTER SUBSCRIBERS */}
        {activeTab === 'newsletter' && (
          <div className="admin-tab-content" role="tabpanel" key="newsletter">
            <NewsletterPanel data={subscribers} loading={refreshing} error={resourceErrors.newsletter || ''} />
          </div>
        )}

        {/* TAB 6: PAYMENT LEDGER (TEST MODE) */}
        {activeTab === 'payments' && (
          <div className="admin-tab-content" role="tabpanel" key="payments">
            <PaymentsPanel data={payments} loading={refreshing} error={resourceErrors.payments || ''} />
          </div>
        )}

        {/* TAB 7: SECURITY AUDIT & ERROR TELEMETRY */}
        {activeTab === 'security' && (
          <div className="admin-tab-content" role="tabpanel" key="security">
            <SecurityPanel data={auditLogs} loading={refreshing} error={resourceErrors.logs || ''} />
          </div>
        )}

        {/* TAB 8: USERS (admin only) */}
        {activeTab === 'users' && isAdmin && (
          <div className="admin-tab-content" role="tabpanel" key="users">
            <UsersPanel data={users} loading={refreshing} error={resourceErrors.users || ''} onCreate={createUser} onPatch={patchUser} onDelete={deleteUser} />
          </div>
        )}

        {/* MODAL: EDIT PRODUCT */}
        {editingProduct && (
          <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
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

        {/* MODAL: ADD PRODUCT (same unified editor, create mode) */}
        {showNewProdModal && (
          <div className="modal-overlay" onClick={() => setShowNewProdModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Add Bespoke Architectural Piece</h3>
              <ProductEditor
                product={null}
                token={token}
                onSaved={handleProductSaved}
                onCancel={() => setShowNewProdModal(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
