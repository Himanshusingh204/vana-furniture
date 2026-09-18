import React from 'react';
import { Trash2, Edit, PackageSearch } from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { useTableControls } from '../../utils/tableControls';
import TableToolbar from './TableToolbar';

// Presentational-only status -> badge tone mapping (no data/logic change).
const STOCK_TONE = {
  'In Stock': 'badge-success',
  'Made-to-Order': 'badge-info',
  Backordered: 'badge-warning',
  Discontinued: 'badge-danger'
};
const stockBadgeClass = (status) => `badge ${STOCK_TONE[status] || 'badge-neutral'}`;

const sortValue = (p, key) => {
  if (key === 'price_inr') return p.price_inr || 0;
  if (key === 'lead_time_weeks') return p.lead_time_weeks || 0;
  return (p[key] || '').toString().toLowerCase();
};

const searchText = (p) => [p.sku, p.name, p.collection, p.wood_type, p.stock_status].filter(Boolean).join(' ');

function SortHeader({ label, sortKeyName, controls }) {
  return (
    <th
      onClick={() => controls.toggleSort(sortKeyName)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      title="Click to sort"
    >
      {label}{controls.sortIndicator(sortKeyName)}
    </th>
  );
}

// Product rows moved verbatim from AdminDashboard (no redesign).
// Adds an Edit button calling onEdit(product); delete preserved via onDelete.
export default function ProductTable({ products, onEdit, onDelete, loading, error }) {
  const controls = useTableControls(products, { getSearchText: searchText, getSortValue: sortValue });

  if (loading && (!products || products.length === 0)) {
    return (
      <div className="admin-table-wrapper" aria-hidden="true">
        <table className="admin-table admin-table-skeleton">
          <thead>
            <tr>
              {['SKU', 'Name', 'Collection', 'Timber Species', 'Price', 'Lead Time', 'Stock Status', '3D Model', 'Action'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3, 4].map((r) => (
              <tr key={r}>
                {Array.from({ length: 9 }).map((_, c) => (
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
  if (!products || products.length === 0) {
    return (
      <div className="admin-empty-state">
        <div className="admin-empty-state-icon"><PackageSearch size={18} aria-hidden="true" /></div>
        <div className="admin-empty-state-title">No pieces in the catalog yet</div>
        <div className="admin-empty-state-sub">Add an architectural piece to start populating the factory catalog and 3D configurator.</div>
      </div>
    );
  }

  return (
    <div>
      <TableToolbar
        search={controls.search}
        onSearch={controls.setSearch}
        placeholder="Search SKU, name, collection, timber…"
        page={controls.page}
        totalPages={controls.totalPages}
        totalCount={controls.totalCount}
        onPage={controls.setPage}
      />
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <SortHeader label="SKU" sortKeyName="sku" controls={controls} />
              <SortHeader label="Name" sortKeyName="name" controls={controls} />
              <SortHeader label="Collection" sortKeyName="collection" controls={controls} />
              <SortHeader label="Timber Species" sortKeyName="wood_type" controls={controls} />
              <SortHeader label="Price" sortKeyName="price_inr" controls={controls} />
              <SortHeader label="Lead Time" sortKeyName="lead_time_weeks" controls={controls} />
              <th>Stock Status</th>
              <th>3D Model</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {controls.pageRows.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.sku}</strong></td>
                <td style={{ fontWeight: 600 }}>
                  {Array.isArray(p.images) && p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', marginRight: '8px', verticalAlign: 'middle' }}
                    />
                  ) : null}
                  {p.name}
                </td>
                <td>{p.collection}</td>
                <td>{p.wood_type}</td>
                <td className="admin-num" style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{formatINR(p.price_inr)}</td>
                <td className="admin-num">{p.lead_time_weeks} Weeks</td>
                <td>
                  <span className={stockBadgeClass(p.stock_status)} style={{ fontSize: '0.72rem' }}>
                    {p.stock_status || 'Unknown'}
                  </span>
                </td>
                <td>
                  <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                    {p.three_config?.model_type || 'Custom'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => onEdit && onEdit(p)}
                    className="btn-ghost"
                    style={{ padding: '4px', marginRight: '4px' }}
                    title="Edit Product"
                  >
                    <Edit size={16} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(p.id)}
                    className="btn-ghost"
                    style={{ padding: '4px', color: 'var(--danger)' }}
                    title="Remove Product"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
