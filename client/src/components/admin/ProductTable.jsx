import React from 'react';
import { Trash2, Edit } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

// Product rows moved verbatim from AdminDashboard (no redesign).
// Adds an Edit button calling onEdit(product); delete preserved via onDelete.
export default function ProductTable({ products, onEdit, onDelete, loading, error }) {
  if (loading && (!products || products.length === 0)) return <div>Loading…</div>;
  if (error) return <div>{error}</div>;
  if (!products || products.length === 0) return <div>No products yet.</div>;

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Collection</th>
            <th>Timber Species</th>
            <th>Price</th>
            <th>Lead Time</th>
            <th>3D Model</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
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
  );
}
