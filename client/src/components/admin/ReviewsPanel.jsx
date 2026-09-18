import React from 'react';
import { MessageSquareText, Star } from 'lucide-react';

// Presentational-only status -> badge tone mapping (no data/logic change).
const REVIEW_TONE = { approved: 'badge-success', pending: 'badge-warning', hidden: 'badge-neutral' };
const reviewBadgeClass = (status) => `badge ${REVIEW_TONE[status] || 'badge-neutral'}`;

// Reviews moderation, extracted verbatim from AdminDashboard (no behavior change).
// Props: { data, loading, error, onModerate(id, patch), onDelete(id) }.
export default function ReviewsPanel({ data, loading, error, onModerate, onDelete }) {
  if (loading && (!data || data.length === 0)) {
    return (
      <div aria-hidden="true">
        {[0, 1, 2].map((r) => (
          <div key={r} className="analytics-pro-card" style={{ marginBottom: '0.8rem' }}>
            <div className="skeleton skeleton-line" style={{ width: '40%', height: '1.1rem' }} />
            <div className="skeleton skeleton-line" style={{ width: '60%' }} />
            <div className="skeleton skeleton-line" style={{ width: '90%' }} />
          </div>
        ))}
      </div>
    );
  }
  if (error) return <div className="admin-empty-state" role="alert">{error}</div>;

  return (
    <div>
      <div className="admin-panel-note">
        Approve, feature on the homepage wall, hide or delete. New submissions arrive approved and broadcast live.
      </div>
      {(!data || data.length === 0) && (
        <div className="admin-empty-state">
          <div className="admin-empty-state-icon"><MessageSquareText size={18} aria-hidden="true" /></div>
          <div className="admin-empty-state-title">No reviews yet</div>
          <div className="admin-empty-state-sub">Customer reviews submitted from product pages will appear here for moderation.</div>
        </div>
      )}
      {data && data.map((r) => (
        <div key={r.id} className="analytics-pro-card" style={{ marginBottom: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <strong>{r.title || 'Untitled'}</strong>
              <span className={reviewBadgeClass(r.status)} style={{ marginLeft: '0.6rem' }}>
                {r.rating}/5 &middot; {r.status}
              </span>
              {r.featured && (
                <span className="badge badge-gold" style={{ marginLeft: '0.4rem' }}>
                  <Star size={11} aria-hidden="true" /> Featured
                </span>
              )}
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
