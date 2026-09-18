import React from 'react';
import { Trash2, Edit } from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { useTableControls } from '../../utils/tableControls';
import TableToolbar from './TableToolbar';

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

  if (loading && (!products || products.length === 0)) return <div>Loading…</div>;
  if (error) return <div>{error}</div>;
  if (!products || products.length === 0) return <div>No products yet.</div>;

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
                <td style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{formatINR(p.price_inr)}</td>
                <td>{p.lead_time_weeks} Weeks</td>
                <td>
                  <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
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
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(p.id)}
                    className="btn-ghost"
                    style={{ padding: '4px', color: 'var(--danger)' }}
                    title="Remove Product"
                  >
                    <Trash2 size={16} />
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
