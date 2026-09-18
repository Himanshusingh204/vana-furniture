import React from 'react';
import { ShieldCheck, Radar } from 'lucide-react';

// Security / audit log stream, extracted verbatim from AdminDashboard.
// Doubles as the audit-log view. Props: { data, loading, error }.
export default function SecurityPanel({ data, loading, error }) {
  if (loading && (!data || data.length === 0)) {
    return (
      <div className="admin-audit-stream" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((r) => (
          <div key={r} className="skeleton skeleton-line" style={{ height: '1rem', margin: '0.6rem 0.5rem', width: `${90 - r * 8}%` }} />
        ))}
      </div>
    );
  }
  if (error) return <div className="admin-empty-state" role="alert">{error}</div>;

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div className="admin-panel-note" style={{ marginBottom: 0 }}>
          Live stream of defensive events, failed logins, and client UI exceptions.
        </div>
        <span className="badge badge-gold">
          <ShieldCheck size={12} aria-hidden="true" /> PII masked
        </span>
      </div>

      {(!data || data.length === 0) ? (
        <div className="admin-empty-state">
          <div className="admin-empty-state-icon"><Radar size={18} aria-hidden="true" /></div>
          <div className="admin-empty-state-title">No security events recorded</div>
          <div className="admin-empty-state-sub">Failed logins, lockouts and client exceptions will stream here as they happen.</div>
        </div>
      ) : (
        <div className="admin-audit-stream">
          {data.map((log) => (
            <div key={log.id} className={`admin-audit-entry ${log.severity}`}>
              <span style={{ color: 'var(--text-muted)' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span style={{ fontWeight: 700 }}>[{log.event_type}]</span>
              <span>{log.details}</span>
              <span className="admin-num" style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>IP: {log.ip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
