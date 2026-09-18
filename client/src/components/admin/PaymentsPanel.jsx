import React from 'react';
import { Receipt } from 'lucide-react';

// Presentational-only status -> badge tone mapping (no data/logic change).
const PAYMENT_TONE = { paid: 'badge-success', pending: 'badge-warning', failed: 'badge-danger', refunded: 'badge-info' };
const paymentBadgeClass = (status) => `badge ${PAYMENT_TONE[(status || '').toLowerCase()] || 'badge-neutral'}`;

// Payment ledger (test-mode, read-only), extracted verbatim from AdminDashboard.
// Props: { data, loading, error }.
export default function PaymentsPanel({ data, loading, error }) {
  if (loading && (!data || data.length === 0)) {
    return (
      <div aria-hidden="true">
        {[0, 1, 2, 3].map((r) => (
          <div key={r} className="funnel-row">
            <div className="skeleton skeleton-line" style={{ width: '150px' }} />
            <div className="skeleton skeleton-line" style={{ width: '150px' }} />
            <div className="skeleton skeleton-line" style={{ width: '80px' }} />
          </div>
        ))}
      </div>
    );
  }
  if (error) return <div className="admin-empty-state" role="alert">{error}</div>;

  return (
    <div>
      <div className="admin-panel-note">
        Test-mode intents from the tracking page. Swap <strong>vanapay-test</strong> for Razorpay keys when ready — same shape.
      </div>
      {(!data || data.length === 0) && (
        <div className="admin-empty-state">
          <div className="admin-empty-state-icon"><Receipt size={18} aria-hidden="true" /></div>
          <div className="admin-empty-state-title">No payments yet</div>
          <div className="admin-empty-state-sub">Complete a test payment from any tracking page to populate the ledger.</div>
        </div>
      )}
      {data && data.map((p) => (
        <div key={p.id} className="funnel-row">
          <span className="funnel-label" title={p.provider_ref}>{p.provider_ref}</span>
          <span className="funnel-label">{p.order_number} · {p.method}</span>
          <span className={paymentBadgeClass(p.status)} style={{ fontSize: '0.68rem' }}>
            {p.status}{p.paid_at ? ` · ${new Date(p.paid_at).toLocaleDateString('en-IN')}` : ''}
          </span>
          <span className="funnel-val admin-num" style={{ width: 'auto' }}>₹{(p.amount_inr || 0).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  );
}
