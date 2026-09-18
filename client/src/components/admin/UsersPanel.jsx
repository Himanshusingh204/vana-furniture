import React, { useState } from 'react';
import { Trash2, UserPlus, Users as UsersIcon } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const ROLES = ['admin', 'editor', 'viewer'];

// Admin-only user management. Assumes the parallel-built /api/users contract:
// GET returns users without passwordHash; POST takes {email,password,role};
// PATCH updates {role} and/or {active} for a user identified by email; DELETE
// removes by email and the server refuses to delete the last admin.
// Props: { data, loading, error, onCreate(user), onPatch(email, patch), onDelete(email) }.
export default function UsersPanel({ data, loading, error, onCreate, onPatch, onDelete }) {
  const [form, setForm] = useState({ email: '', password: '', role: 'viewer' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await onCreate(form);
      setForm({ email: '', password: '', role: 'viewer' });
    } catch (err) {
      setFormError(err.message || 'Could not create user');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && (!data || data.length === 0)) {
    return (
      <div className="admin-table-wrapper" aria-hidden="true">
        <table className="admin-table admin-table-skeleton">
          <thead>
            <tr>
              {['Email', 'Role', 'Status', 'Created', 'Action'].map((h) => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2].map((r) => (
              <tr key={r}>
                {Array.from({ length: 5 }).map((_, c) => (
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

  return (
    <div>
      <div className="analytics-pro-card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginBottom: '1rem' }}><UserPlus size={15} aria-hidden="true" style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />Add console user</h3>
        <form onSubmit={handleCreate}>
          {formError && (
            <div className="admin-feedback danger" role="alert" style={{ marginBottom: '1rem' }}>
              {formError}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="input-luxury"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="input-luxury"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="select-luxury"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '0.6rem 1rem' }}>
              {submitting ? 'Adding…' : 'Add User'}
            </button>
          </div>
        </form>
      </div>

      {(!data || data.length === 0) && (
        <div className="admin-empty-state">
          <div className="admin-empty-state-icon"><UsersIcon size={18} aria-hidden="true" /></div>
          <div className="admin-empty-state-title">No console users yet</div>
          <div className="admin-empty-state-sub">Add the first teammate above to grant console access.</div>
        </div>
      )}
      {data && data.length > 0 && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.email}>
                  <td><strong>{u.email}</strong></td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => onPatch(u.email, { role: e.target.value })}
                      className="select-luxury"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${u.active === false ? 'badge-neutral' : 'badge-success'}`} style={{ fontSize: '0.72rem' }}>
                      {u.active === false ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                  <td className="admin-num" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {u.created_at ? formatDate(u.created_at) : '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => onPatch(u.email, { active: u.active === false })}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', marginRight: '0.5rem' }}
                    >
                      {u.active === false ? 'Reactivate' : 'Deactivate'}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove ${u.email} from the console?`)) onDelete(u.email);
                      }}
                      className="btn-ghost"
                      style={{ padding: '4px', color: 'var(--danger)' }}
                      title="Delete User"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
