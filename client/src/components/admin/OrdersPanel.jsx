import React from 'react';
import { ClipboardList } from 'lucide-react';
import { formatINR, formatDate } from '../../utils/formatters';
import { ORDER_STAGES, stageIndex } from '../../utils/shop';
import { useTableControls } from '../../utils/tableControls';
import TableToolbar from './TableToolbar';

// Presentational-only stage -> badge tone mapping (position in the fixed
// manufacturing pipeline, no business logic touched).
const stageBadgeClass = (stage) => {
  const i = stageIndex(stage);
  if (i >= ORDER_STAGES.length - 1) return 'badge badge-success';
  if (i <= 0) return 'badge badge-info';
  return 'badge badge-neutral';
};

const sortValue = (o, key) => {
  if (key === 'created_at') return o.created_at ? new Date(o.created_at).getTime() : 0;
  if (key === 'total_inr') return o.total_inr || 0;
  if (key === 'customer_name') return (o.customer_name || '').toLowerCase();
  return (o[key] || '').toString().toLowerCase();
};

const searchText = (o) => [
  o.order_number,
  o.customer_name,
  o.shipping_address?.city,
  o.shipping_address?.state,
  o.manufacturing_stage,
  o.payment_status,
  ...(o.items || []).map((i) => i.product_name)
].filter(Boolean).join(' ');

function SortHeader({ label, sortKeyName, controls }) {
  return (
    <th onClick={() => controls.toggleSort(sortKeyName)} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort">
      {label}{controls.sortIndicator(sortKeyName)}
    </th>
  );
}

// Orders section moved verbatim from AdminDashboard (no logic change).
// Stage updates via onStageChange(orderId, newStage) owned by the shell.
export default function OrdersPanel({ data, loading, error, onStageChange }) {
  // Server labels are canonical — imported from the single source in shop.js.
  const stages = ORDER_STAGES;
  const controls = useTableControls(data, { getSearchText: searchText, getSortValue: sortValue });

  if (loading && (!data || data.length === 0)) {
    return (
      <div className="admin-table-wrapper" aria-hidden="true">
        <table className="admin-table admin-table-skeleton">
          <thead>
            <tr>
              {['Work Order Ref', 'Client / Architect', 'Pieces & Finishes', 'Contract Total', 'Contract Status', 'Manufacturing Stage', 'Action'].map((h) => (
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
        <div className="admin-empty-state-icon"><ClipboardList size={18} aria-hidden="true" /></div>
        <div className="admin-empty-state-title">No work orders yet</div>
        <div className="admin-empty-state-sub">Factory commission orders appear here as soon as a client checks out.</div>
      </div>
    );
  }

  return (
    <div>
      <TableToolbar
        search={controls.search}
        onSearch={controls.setSearch}
        placeholder="Search order #, client, city, stage…"
        page={controls.page}
        totalPages={controls.totalPages}
        totalCount={controls.totalCount}
        onPage={controls.setPage}
      />
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <SortHeader label="Work Order Ref" sortKeyName="created_at" controls={controls} />
              <SortHeader label="Client / Architect" sortKeyName="customer_name" controls={controls} />
              <th>Pieces & Finishes</th>
              <SortHeader label="Contract Total" sortKeyName="total_inr" controls={controls} />
              <th>Contract Status</th>
              <th>Manufacturing Stage</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {controls.pageRows.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>{o.order_number}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {formatDate(o.created_at)}
                  </div>
                </td>
                <td>
                  <div>{o.customer_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {o.shipping_address?.city}, {o.shipping_address?.state}
                  </div>
                </td>
                <td>
                  {o.items?.map((item, idx) => (
                    <div key={idx} style={{ fontSize: '0.8rem' }}>
                      {item.product_name} ({item.finish_selected}) × {item.quantity}
                    </div>
                  ))}
                </td>
                <td className="admin-num" style={{ fontWeight: 600 }}>{formatINR(o.total_inr)}</td>
                <td style={{ color: 'var(--accent-gold)' }}>
                  {o.payment_status || 'Factory Commission'}
                </td>
                <td>
                  <span className={stageBadgeClass(o.manufacturing_stage)} style={{ fontSize: '0.72rem' }}>
                    {o.manufacturing_stage}
                  </span>
                </td>
                <td>
                  <select
                    value={o.manufacturing_stage}
                    onChange={(e) => onStageChange && onStageChange(o.id, e.target.value)}
                    className="select-luxury"
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                  >
                    {stages.map((st) => (
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
