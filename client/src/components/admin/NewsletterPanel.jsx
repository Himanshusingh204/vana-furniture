import React from 'react';
import { Download } from 'lucide-react';
import { exportCsv } from '../../utils/csv';

// Newsletter subscriber list, extracted verbatim from AdminDashboard (no behavior change).
// Props: { data, loading, error }.
export default function NewsletterPanel({ data, loading, error }) {
  if (loading && (!data || data.length === 0)) return <div>Loading…</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Owner-only list. Export for your mail tool; never share publicly.
        </div>
        <button
          className="btn btn-secondary"
          style={{ padding: '0.55rem 1rem', fontSize: '0.75rem' }}
          onClick={() => exportCsv('vana-newsletter.csv', [['email', 'name', 'subscribed_at'], ...(data || []).map((s) => [s.email, s.name, s.created_at])])}
        >
          <Download size={14} /> Subscribers CSV
        </button>
      </div>
      {(!data || data.length === 0) && <div style={{ color: 'var(--text-muted)' }}>No subscribers yet. The homepage block feeds this list.</div>}
      {data && data.map((s) => (
        <div key={s.id} className="funnel-row">
          <span className="funnel-label" title={s.email} style={{ width: '260px', flexBasis: '260px' }}>{s.email}</span>
          <span className="funnel-label">{s.name || '—'}</span>
          <span className="funnel-val" style={{ width: 'auto' }}>{s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN') : ''}</span>
        </div>
      ))}
    </div>
  );
}
