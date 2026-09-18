import React from 'react';
import { Download, Mail } from 'lucide-react';
import { exportCsv } from '../../utils/csv';

// Newsletter subscriber list, extracted verbatim from AdminDashboard (no behavior change).
// Props: { data, loading, error }.
export default function NewsletterPanel({ data, loading, error }) {
  if (loading && (!data || data.length === 0)) {
    return (
      <div aria-hidden="true">
        {[0, 1, 2, 3].map((r) => (
          <div key={r} className="funnel-row">
            <div className="skeleton skeleton-line" style={{ width: '260px' }} />
            <div className="skeleton skeleton-line" style={{ width: '120px' }} />
          </div>
        ))}
      </div>
    );
  }
  if (error) return <div className="admin-empty-state" role="alert">{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div className="admin-panel-note" style={{ marginBottom: 0 }}>
          Owner-only list. Export for your mail tool; never share publicly.
        </div>
        <button
          className="btn btn-secondary"
          style={{ padding: '0.55rem 1rem', fontSize: '0.75rem' }}
          onClick={() => exportCsv('vana-newsletter.csv', [['email', 'name', 'subscribed_at'], ...(data || []).map((s) => [s.email, s.name, s.created_at])])}
        >
          <Download size={14} aria-hidden="true" /> Subscribers CSV
        </button>
      </div>
      {(!data || data.length === 0) && (
        <div className="admin-empty-state">
          <div className="admin-empty-state-icon"><Mail size={18} aria-hidden="true" /></div>
          <div className="admin-empty-state-title">No subscribers yet</div>
          <div className="admin-empty-state-sub">The homepage newsletter block feeds this list as visitors sign up.</div>
        </div>
      )}
      {data && data.map((s) => (
        <div key={s.id} className="funnel-row">
          <span className="funnel-label" title={s.email} style={{ width: '260px', flexBasis: '260px' }}>{s.email}</span>
          <span className="funnel-label">{s.name || '—'}</span>
          <span className="funnel-val admin-num" style={{ width: 'auto' }}>{s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN') : ''}</span>
        </div>
      ))}
    </div>
  );
}
