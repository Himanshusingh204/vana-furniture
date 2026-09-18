import React from 'react';
import { formatINR } from '../../utils/formatters';

// Cards for revenue, quote volume, active jobs, product count.
// Uses analytics values fetched in the shell. No fetch inside.
export default function OverviewCards({ stats, loading, error, productCount = 0, activeVisitors = 0 }) {
  if (loading && !stats) return <div className="admin-stats-grid">Loading…</div>;
  if (error) return <div className="admin-stats-grid">{error}</div>;

  return (
    <div className="admin-stats-grid">
      <div className="admin-stat-card gold">
        <div className="admin-stat-label">Active Workshop Order Value</div>
        <div className="admin-stat-val">
          {formatINR(stats?.total_revenue_inr || 0)}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Contract Allocations: {formatINR(stats?.deposits_collected_inr || 0)}
        </div>
      </div>

      <div className="admin-stat-card green">
        <div className="admin-stat-label">Real Active Visitors</div>
        <div className="admin-stat-val">
          {activeVisitors} online
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          WebSocket live heartbeat stream
        </div>
      </div>

      <div className="admin-stat-card blue">
        <div className="admin-stat-label">Custom CAD Inquiries</div>
        <div className="admin-stat-val">
          {stats?.total_cad_quotes || 0}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {stats?.pending_cad_reviews || 0} pending engineering check
        </div>
      </div>

      <div className="admin-stat-card purple">
        <div className="admin-stat-label">Active Factory Jobs</div>
        <div className="admin-stat-val">
          {stats?.active_manufacturing_jobs || 0}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Conversion: {stats?.quote_conversion_rate_pct || 0}% &bull; Catalog: {productCount} pieces
        </div>
      </div>
    </div>
  );
}
