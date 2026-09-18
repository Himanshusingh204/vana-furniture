import React from 'react';
import { Download, FileSearch } from 'lucide-react';
import { formatINR, formatDate } from '../../utils/formatters';
import { QUOTE_STATUSES } from '../../utils/shop';
import { useTableControls } from '../../utils/tableControls';
import TableToolbar from './TableToolbar';

// Presentational-only status -> badge tone mapping (position in the fixed
// quote triage pipeline, no business logic touched).
const quoteBadgeClass = (status) => {
  const i = QUOTE_STATUSES.indexOf(status);
  if (i === QUOTE_STATUSES.length - 1) return 'badge badge-success';
  if (i <= 0) return 'badge badge-info';
  return 'badge badge-neutral';
};

const sortValue = (q, key) => {
  if (key === 'created_at') return q.created_at ? new Date(q.created_at).getTime() : 0;
  if (key === 'estimated_budget_inr') return q.estimated_budget_inr || 0;
  if (key === 'client_name') return (q.client_name || '').toLowerCase();
  return (q[key] || '').toString().toLowerCase();
};

const searchText = (q) => [
  q.quote_number,
  q.client_name,
  q.organization,
  q.client_email,
  q.wood_preference,
  q.status
].filter(Boolean).join(' ');

function SortHeader({ label, sortKeyName, controls }) {
  return (
    <th onClick={() => controls.toggleSort(sortKeyName)} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort">
      {label}{controls.sortIndicator(sortKeyName)}
    </th>
  );
}

// Quotes section moved verbatim from AdminDashboard (no logic change).
// Status updates via onStatusChange(quoteId, newStatus) owned by the shell.
export default function QuotesPanel({ data, loading, error, onStatusChange }) {
  const quoteStatuses = QUOTE_STATUSES;
  const controls = useTableControls(data, { getSearchText: searchText, getSortValue: sortValue });

  if (loading && (!data || data.length === 0)) {
    return (
      <div className="admin-table-wrapper" aria-hidden="true">
        <table className="admin-table admin-table-skeleton">
          <thead>
            <tr>
              {['Quote Ref', 'Architect / Studio', 'Hardwood & Specs', 'Est. Budget', 'Attached CAD Asset', 'Current Status', 'Advance Phase'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3, 4].map((r) => (
              <tr key={r}>
                {Array.from({ length: 7 }).map((_, c) => (
                  <td key={c}><div className="skeleton skeleton-line" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (error) return <div className="admin-empty-state" role="alert">{error}</div>;
  if (!data || data.length === 0) {
    return (
      <div className="admin-empty-state">
        <div className="admin-empty-state-icon"><FileSearch size={18} aria-hidden="true" /></div>
        <div className="admin-empty-state-title">No CAD inquiries yet</div>
        <div className="admin-empty-state-sub">Custom blueprint requests submitted from the site will show up here for engineering review.</div>
      </div>
    );
  }

  return (
    <div>
      <TableToolbar
        search={controls.search}
        onSearch={controls.setSearch}
        placeholder="Search quote #, client, org, wood…"
        page={controls.page}
        totalPages={controls.totalPages}
        totalCount={controls.totalCount}
        onPage={controls.setPage}
      />
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <SortHeader label="Quote Ref" sortKeyName="created_at" controls={controls} />
              <SortHeader label="Architect / Studio" sortKeyName="client_name" controls={controls} />
              <th>Hardwood & Specs</th>
              <SortHeader label="Est. Budget" sortKeyName="estimated_budget_inr" controls={controls} />
              <th>Attached CAD Asset</th>
              <th>Current Status</th>
              <th>Advance Phase</th>
            </tr>
          </thead>
          <tbody>
            {controls.pageRows.map((q) => (
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
                <td className="admin-num" style={{ fontWeight: 600 }}>{formatINR(q.estimated_budget_inr)}</td>
                <td>
                  {q.cad_file_path || q.cad_file_name ? (
                    <a
                      href={q.cad_file_path || `/api/quotes/file/${q.cad_file_stored}`}
                      download
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      <Download size={14} aria-hidden="true" /> {q.cad_file_name || 'Download CAD'}
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No CAD attached</span>
                  )}
                </td>
                <td>
                  <span className={quoteBadgeClass(q.status)} style={{ fontSize: '0.72rem' }}>
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
    </div>
  );
}
