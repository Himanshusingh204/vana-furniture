import React from 'react';
import { Download } from 'lucide-react';
import { formatINR, formatDate } from '../../utils/formatters';
import { QUOTE_STATUSES } from '../../utils/shop';

// Quotes section moved verbatim from AdminDashboard (no logic change).
// Status updates via onStatusChange(quoteId, newStatus) owned by the shell.
export default function QuotesPanel({ data, loading, error, onStatusChange }) {
  const quoteStatuses = QUOTE_STATUSES;

  if (loading && (!data || data.length === 0)) return <div>Loading…</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Quote Ref</th>
            <th>Architect / Studio</th>
            <th>Hardwood & Specs</th>
            <th>Est. Budget</th>
            <th>Attached CAD Asset</th>
            <th>Current Status</th>
            <th>Advance Phase</th>
          </tr>
        </thead>
        <tbody>
          {data.map((q) => (
            <tr key={q.id}>
              <td>
                <strong>{q.quote_number}</strong>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {formatDate(q.created_at)}
                </div>
              </td>
              <td>
                <div>{q.client_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
                  {q.organization}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {q.client_phone} &bull; {q.client_email}
                </div>
              </td>
              <td>
                <div style={{ fontWeight: 500 }}>{q.wood_preference}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {q.target_dimensions}
                </div>
                {q.internal_engineering_notes && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Notes: {q.internal_engineering_notes}
                  </div>
                )}
              </td>
              <td style={{ fontWeight: 600 }}>{formatINR(q.estimated_budget_inr)}</td>
              <td>
                {q.cad_file_path || q.cad_file_name ? (
                  <a
                    href={q.cad_file_path || `/api/quotes/file/${q.cad_file_stored}`}
                    download
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                  >
                    <Download size={14} /> {q.cad_file_name || 'Download CAD'}
                  </a>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No CAD attached</span>
                )}
              </td>
              <td>
                <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                  {q.status}
                </span>
              </td>
              <td>
                <select
                  value={q.status}
                  onChange={(e) => onStatusChange && onStatusChange(q.id, e.target.value)}
                  className="select-luxury"
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                >
                  {quoteStatuses.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
