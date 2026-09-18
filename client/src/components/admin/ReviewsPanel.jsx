import React from 'react';

// Reviews moderation, extracted verbatim from AdminDashboard (no behavior change).
// Props: { data, loading, error, onModerate(id, patch), onDelete(id) }.
export default function ReviewsPanel({ data, loading, error, onModerate, onDelete }) {
  if (loading && (!data || data.length === 0)) return <div>Loading…</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Approve, feature on the homepage wall, hide or delete. New submissions arrive approved and broadcast live.
      </div>
      {(!data || data.length === 0) && <div style={{ color: 'var(--text-muted)' }}>No reviews yet.</div>}
      {data && data.map((r) => (
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
              <button className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.75rem' }} onClick={() => onModerate(r.id, { status: r.status === 'approved' ? 'hidden' : 'approved' })}>
                {r.status === 'approved' ? 'Hide' : 'Approve'}
              </button>
              <button className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.75rem' }} onClick={() => onModerate(r.id, { featured: !r.featured })}>
                {r.featured ? 'Unfeature' : 'Feature'}
              </button>
              <button className="btn btn-outline" style={{ padding: '0.45rem 0.9rem', fontSize: '0.75rem' }} onClick={() => onDelete(r.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
