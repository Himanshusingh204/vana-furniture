import React from 'react';
import { ShieldCheck } from 'lucide-react';

// Security / audit log stream, extracted verbatim from AdminDashboard.
// Doubles as the audit-log view. Props: { data, loading, error }.
export default function SecurityPanel({ data, loading, error }) {
  if (loading && (!data || data.length === 0)) return <div>Loading…</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Live Stream of Defensive Events, Failed Logins, and Client UI Exceptions:
        </div>
        <span className="badge badge-gold">
          <ShieldCheck size={12} /> PII Masked
        </span>
      </div>

      <div className="admin-audit-stream">
        {(data || []).map((log) => (
          <div key={log.id} className={`admin-audit-entry ${log.severity}`}>
            <span style={{ color: '#888' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
            <span style={{ fontWeight: 700 }}>[{log.event_type}]</span>
            <span>{log.details}</span>
            <span style={{ marginLeft: 'auto', color: '#666' }}>IP: {log.ip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
