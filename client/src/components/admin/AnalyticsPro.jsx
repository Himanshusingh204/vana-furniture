import React, { useMemo } from 'react';
import { formatINR } from '../../utils/formatters';
import { Download, TrendingUp, Filter } from 'lucide-react';

// Pro analytics: dependency-free SVG charts computed from real records.
// Props: analytics (extended backend payload), orders, quotes, products, activeVisitors.
export default function AnalyticsPro({ analytics, orders = [], quotes = [], products = [], activeVisitors = 0 }) {
  const derived = useMemo(() => {
    // Revenue trend: prefer backend buckets, fallback to bucketing raw orders.
    let trend = Array.isArray(analytics?.revenue_by_month_6m) ? analytics.revenue_by_month_6m : [];
    if (!trend.length && orders.length) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      trend = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const revenue = orders
          .filter((o) => (o.created_at || '').slice(0, 7) === key)
          .reduce((s, o) => s + (o.total_inr || 0), 0);
        trend.push({ month: months[d.getMonth()], key, revenue_inr: revenue });
      }
    }

    const ordersByStage = analytics?.orders_by_stage || orders.reduce((m, o) => {
      const s = o.manufacturing_stage || 'Unknown';
      m[s] = (m[s] || 0) + 1;
      return m;
    }, {});

    const quotesByStatus = analytics?.quotes_by_status || quotes.reduce((m, q) => {
      const s = q.status || 'Received';
      m[s] = (m[s] || 0) + 1;
      return m;
    }, {});

    const woodMix = analytics?.wood_inventory_distribution || products.reduce((m, p) => {
      m[p.wood_type || 'Unknown'] = (m[p.wood_type || 'Unknown'] || 0) + 1;
      return m;
    }, {});

    const topCollections = Array.isArray(analytics?.top_collections) && analytics.top_collections.length
      ? analytics.top_collections
      : Object.entries(
          products.reduce((m, p) => {
            const c = p.collection || 'Living';
            m[c] = (m[c] || 0) + 1;
            return m;
          }, {})
        ).map(([collection, count]) => ({ collection, count, revenue_inr: 0 }));

    const maxTrend = Math.max(1, ...trend.map((t) => t.revenue_inr || 0));
    const maxStage = Math.max(1, ...Object.values(ordersByStage));
    const maxQuote = Math.max(1, ...Object.values(quotesByStatus));
    const maxWood = Math.max(1, ...Object.values(woodMix));

    return { trend, ordersByStage, quotesByStatus, woodMix, topCollections, maxTrend, maxStage, maxQuote, maxWood };
  }, [analytics, orders, quotes, products]);

  // SVG revenue line (560x180 viewBox, tabular numbers, no animation loops)
  const line = useMemo(() => {
    const W = 560;
    const H = 180;
    const PAD = 28;
    const pts = derived.trend.map((t, i) => {
      const x = derived.trend.length === 1
        ? W / 2
        : PAD + (i * (W - PAD * 2)) / Math.max(1, derived.trend.length - 1);
      const y = H - PAD - ((t.revenue_inr || 0) / derived.maxTrend) * (H - PAD * 2);
      return { x, y, ...t };
    });
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = pts.length ? `${d} L${pts[pts.length - 1].x.toFixed(1)},${(H - PAD).toFixed(1)} L${pts[0].x.toFixed(1)},${(H - PAD).toFixed(1)} Z` : '';
    return { W, H, PAD, pts, d, area };
  }, [derived]);

  const downloadCsv = (name, rows) => {
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportOrders = () => {
    downloadCsv('vana-orders.csv', [
      ['order_number', 'created_at', 'customer_name', 'total_inr', 'deposit_paid_inr', 'stage'],
      ...orders.map((o) => [o.order_number, o.created_at, o.customer_name, o.total_inr, o.deposit_paid_inr, o.manufacturing_stage])
    ]);
  };

  const exportQuotes = () => {
    downloadCsv('vana-quotes.csv', [
      ['quote_number', 'created_at', 'client_name', 'status', 'project_type'],
      ...quotes.map((q) => [q.quote_number, q.created_at, q.client_name, q.status, q.project_type])
    ]);
  };

  const kpis = [
    { label: 'Revenue', val: formatINR(analytics?.total_revenue_inr || 0), hint: `Deposits ${formatINR(analytics?.deposits_collected_inr || 0)}` },
    { label: 'Avg order value', val: formatINR(analytics?.avg_order_value_inr || 0), hint: `${analytics?.total_orders || orders.length} orders` },
    { label: 'CAD inquiries', val: String(analytics?.total_cad_quotes ?? quotes.length), hint: `${analytics?.pending_cad_reviews ?? 0} pending review` },
    { label: 'Active jobs', val: String(analytics?.active_manufacturing_jobs ?? 0), hint: `Conversion ${analytics?.quote_conversion_rate_pct ?? 0}%` },
    { label: 'Catalog pieces', val: String(products.length), hint: `${Object.keys(derived.woodMix).length} timber lines` },
    { label: 'Live visitors', val: `${activeVisitors} online`, hint: 'WebSocket heartbeat' }
  ];

  return (
    <section aria-label="Professional business analytics">
      <div className="analytics-kpi6">
        {kpis.map((k) => (
          <div key={k.label} className="analytics-kpi">
            <div className="analytics-kpi-label">{k.label}</div>
            <div className="analytics-kpi-val">{k.val}</div>
            <div className="analytics-kpi-hint">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="analytics-pro-grid">
        <div className="analytics-pro-card">
          <h3><TrendingUp size={15} style={{ display: 'inline', marginRight: '6px' }} />Revenue trend · last 6 months</h3>
          <div className="analytics-pro-sub">Real order totals bucketed by created month. No mock data.</div>
          {line.pts.length ? (
            <svg viewBox={`0 0 ${line.W} ${line.H}`} width="100%" height="180" role="img" aria-label="Revenue trend chart for the last six months">
              {[0.25, 0.5, 0.75].map((f) => (
                <line
                  key={f}
                  x1={line.PAD}
                  x2={line.W - line.PAD}
                  y1={line.PAD + f * (line.H - line.PAD * 2)}
                  y2={line.PAD + f * (line.H - line.PAD * 2)}
                  stroke="var(--border-subtle)"
                  strokeWidth="1"
                />
              ))}
              <path d={line.area} fill="var(--accent-gold-subtle)" />
              <path d={line.d} fill="none" stroke="var(--text-primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {line.pts.map((p) => (
                <g key={p.key}>
                  <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-primary)" stroke="var(--text-primary)" strokeWidth="2" />
                  <text x={p.x} y={line.H - 8} textAnchor="middle" fontSize="11" fill="var(--text-secondary)">{p.month}</text>
                </g>
              ))}
            </svg>
          ) : (
            <div className="analytics-pro-sub">No revenue buckets yet. Place an order to populate this chart.</div>
          )}
          <div className="csv-btn-row">
            <button className="btn btn-secondary" style={{ padding: '0.55rem 1rem', fontSize: '0.75rem' }} onClick={exportOrders}>
              <Download size={14} /> Orders CSV
            </button>
            <button className="btn btn-secondary" style={{ padding: '0.55rem 1rem', fontSize: '0.75rem' }} onClick={exportQuotes}>
              <Download size={14} /> Quotes CSV
            </button>
          </div>
        </div>

        <div className="analytics-pro-card">
          <h3><Filter size={15} style={{ display: 'inline', marginRight: '6px' }} />Order stages · live funnel</h3>
          <div className="analytics-pro-sub">Manufacturing pipeline distribution from real orders.</div>
          {Object.entries(derived.ordersByStage).map(([stage, count]) => (
            <div key={stage} className="funnel-row">
              <span className="funnel-label" title={stage}>{stage}</span>
              <span className="funnel-track"><span className="funnel-fill" style={{ display: 'block', width: `${Math.round((count / derived.maxStage) * 100)}%` }} /></span>
              <span className="funnel-val">{count}</span>
            </div>
          ))}
          <h3 style={{ marginTop: '1.4rem' }}>Quote pipeline</h3>
          <div className="analytics-pro-sub">CAD inquiry status from real quotes.</div>
          {Object.entries(derived.quotesByStatus).map(([status, count]) => (
            <div key={status} className="funnel-row">
              <span className="funnel-label" title={status}>{status}</span>
              <span className="funnel-track"><span className="funnel-fill" style={{ display: 'block', width: `${Math.round((count / derived.maxQuote) * 100)}%`, opacity: 0.65 }} /></span>
              <span className="funnel-val">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-pro-grid">
        <div className="analytics-pro-card">
          <h3>Timber mix · catalog composition</h3>
          <div className="analytics-pro-sub">Piece counts per timber line.</div>
          {Object.entries(derived.woodMix).map(([wood, count]) => (
            <div key={wood} className="funnel-row">
              <span className="funnel-label" title={wood}>{wood}</span>
              <span className="funnel-track"><span className="funnel-fill" style={{ display: 'block', width: `${Math.round((count / derived.maxWood) * 100)}%`, opacity: 0.45 }} /></span>
              <span className="funnel-val">{count}</span>
            </div>
          ))}
        </div>
        <div className="analytics-pro-card">
          <h3>Top collections</h3>
          <div className="analytics-pro-sub">Catalog depth plus attributed order revenue.</div>
          {derived.topCollections.map((c) => (
            <div key={c.collection} className="funnel-row">
              <span className="funnel-label" title={c.collection}>{c.collection}</span>
              <span className="funnel-track"><span className="funnel-fill" style={{ display: 'block', width: `${Math.min(100, Math.max(8, c.count * 18))}%`, opacity: 0.8 }} /></span>
              <span className="funnel-val">{c.count}</span>
            </div>
          ))}
          {derived.topCollections.every((c) => !(c.revenue_inr > 0)) && (
            <div className="analytics-pro-sub">Revenue attribution appears after orders reference catalog products.</div>
          )}
        </div>
      </div>
    </section>
  );
}
