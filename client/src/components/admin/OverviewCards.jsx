import React from 'react';
import { Wallet, Radio, Ruler, Hammer } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

// Cards for revenue, quote volume, active jobs, product count.
// Uses analytics values fetched in the shell. No fetch inside.
export default function OverviewCards({ stats, loading, error, productCount = 0, activeVisitors = 0 }) {
  if (loading && !stats) {
    return (
      <section aria-label="Console overview">
        <span className="eyebrow">At a glance</span>
        <div className="admin-stats-grid" aria-hidden="true">
          {['a', 'b', 'c', 'd'].map((k) => (
            <div key={k} className="admin-stat-card admin-skeleton-card">
              <div className="skeleton skeleton-icon" />
              <div className="skeleton skeleton-line" style={{ width: '60%' }} />
              <div className="skeleton skeleton-line" style={{ width: '40%', height: '1.6rem', margin: '0.5rem 0' }} />
              <div className="skeleton skeleton-line" style={{ width: '75%' }} />
            </div>
          ))}
        </div>
      </section>
    );
  }
  if (error) {
    return (
      <section aria-label="Console overview">
        <span className="eyebrow">At a glance</span>
        <div className="admin-empty-state" role="alert">{error}</div>
      </section>
    );
  }

  return (
    <section aria-label="Console overview">
      <span className="eyebrow">At a glance</span>
      <div className="admin-stats-grid">
        <div className="admin-stat-card gold">
          <div className="admin-stat-icon"><Wallet size={16} aria-hidden="true" /></div>
          <div className="admin-stat-label">Active Workshop Order Value</div>
          <div className="admin-stat-val">
            {formatINR(stats?.total_revenue_inr || 0)}
          </div>
          <div className="admin-stat-foot">
            Contract Allocations: {formatINR(stats?.deposits_collected_inr || 0)}
          </div>
        </div>

        <div className="admin-stat-card green">
          <div className="admin-stat-icon"><Radio size={16} aria-hidden="true" /></div>
          <div className="admin-stat-label">Real Active Visitors</div>
          <div className="admin-stat-val">
            {activeVisitors} online
          </div>
          <div className="admin-stat-foot">
            WebSocket live heartbeat stream
          </div>
        </div>

        <div className="admin-stat-card blue">
          <div className="admin-stat-icon"><Ruler size={16} aria-hidden="true" /></div>
          <div className="admin-stat-label">Custom CAD Inquiries</div>
          <div className="admin-stat-val">
            {stats?.total_cad_quotes || 0}
          </div>
          <div className="admin-stat-foot">
            {stats?.pending_cad_reviews || 0} pending engineering check
          </div>
        </div>

        <div className="admin-stat-card purple">
          <div className="admin-stat-icon"><Hammer size={16} aria-hidden="true" /></div>
          <div className="admin-stat-label">Active Factory Jobs</div>
          <div className="admin-stat-val">
            {stats?.active_manufacturing_jobs || 0}
          </div>
          <div className="admin-stat-foot">
            Conversion: {stats?.quote_conversion_rate_pct || 0}% &bull; Catalog: {productCount} pieces
          </div>
        </div>
      </div>
    </section>
  );
}
