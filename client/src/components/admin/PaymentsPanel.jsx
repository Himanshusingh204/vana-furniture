import React from 'react';

// Payment ledger (test-mode, read-only), extracted verbatim from AdminDashboard.
// Props: { data, loading, error }.
export default function PaymentsPanel({ data, loading, error }) {
  if (loading && (!data || data.length === 0)) return <div>Loading…</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Test-mode intents from the tracking page. Swap <strong>vanapay-test</strong> for Razorpay keys when ready — same shape.
      </div>
      {(!data || data.length === 0) && <div style={{ color: 'var(--text-muted)' }}>No payments yet. Complete a test payment from any tracking page.</div>}
      {data && data.map((p) => (
        <div key={p.id} className="funnel-row">
          <span className="funnel-label" title={p.provider_ref}>{p.provider_ref}</span>
          <span className="funnel-label">{p.order_number} · {p.method}</span>
          <span className="funnel-label">{p.status}{p.paid_at ? ` · ${new Date(p.paid_at).toLocaleDateString('en-IN')}` : ''}</span>
          <span className="funnel-val" style={{ width: 'auto' }}>₹{(p.amount_inr || 0).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  );
}
