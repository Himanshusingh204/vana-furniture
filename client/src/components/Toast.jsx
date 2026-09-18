import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Bell, X } from 'lucide-react';

export default function Toast() {
  const { lastNotification, clearNotification } = useSocket();

  useEffect(() => {
    if (lastNotification) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastNotification, clearNotification]);

  if (!lastNotification) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 9999,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        maxWidth: '420px',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'var(--accent-gold-subtle)',
          color: 'var(--accent-gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <Bell size={18} aria-hidden="true" />
      </div>
      <div style={{ flexGrow: 1 }}>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: 600 }}>
          Live Atelier Activity
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: '2px' }}>
          {lastNotification.message}
        </div>
      </div>
      <button onClick={clearNotification} className="btn-ghost" style={{ padding: '4px' }} aria-label="Dismiss notification">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
