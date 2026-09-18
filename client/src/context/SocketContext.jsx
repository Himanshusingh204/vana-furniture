import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const SocketContext = createContext();

function resolveWsUrl() {
  // Priority: explicit WS URL > derived from API URL > location.host fallback.
  const envWs = import.meta.env?.VITE_WS_URL;
  if (envWs) return envWs;
  const apiUrl = import.meta.env?.VITE_API_URL;
  if (apiUrl) {
    try {
      const u = new URL(apiUrl, window.location.href);
      u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
      // Strip trailing /api so ws lands on the pathless gateway root.
      u.pathname = u.pathname.replace(/\/api\/?$/, '/').replace(/\/+$/, '/');
      u.search = '';
      u.hash = '';
      return u.toString().replace(/\/+$/, '');
    } catch (e) {
      // fall through to host logic
    }
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
  return `${protocol}//${host}`;
}

const NOTIFICATION_TYPES = [
  'NEW_QUOTE_SUBMITTED',
  'ORDER_PLACED',
  'SYSTEM_ALERT',
  'QUOTE_STATUS_UPDATED',
  'ORDER_STAGE_UPDATED',
  'REVIEW_SUBMITTED',
  'REVIEW_MODERATED',
  'PAYMENT_CONFIRMED'
];

const PRODUCT_EVENT_TYPES = ['PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED'];

export function SocketProvider({ children }) {
  const [activeVisitors, setActiveVisitors] = useState(1);
  const [connected, setConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [lastProductUpdate, setLastProductUpdate] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    function scheduleReconnect() {
      // Exponential backoff: 1s * 2^n, capped at 30s.
      const delay = Math.min(1000 * Math.pow(2, attemptsRef.current), 30000);
      attemptsRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    }

    function pushNotification(data) {
      const friendlyFallbacks = {
        REVIEW_SUBMITTED: 'New buyer review received',
        REVIEW_MODERATED: 'A review was moderated',
        PAYMENT_CONFIRMED: 'Test payment confirmed',
        PRODUCT_CREATED: 'New product added to catalog',
        PRODUCT_DELETED: 'A product was removed from catalog'
      };
      const note = {
        id: Date.now(),
        type: data.type,
        message: data.message || friendlyFallbacks[data.type] || `Real-time event: ${data.type}`,
        timestamp: new Date().toLocaleTimeString()
      };
      // Queue semantics: keep latest notification + running count.
      setLastNotification(note);
      setNotificationCount((c) => c + 1);
    }

    function connect() {
      const wsUrl = resolveWsUrl();
      let ws;
      try {
        ws = new WebSocket(wsUrl);
      } catch (e) {
        scheduleReconnect();
        return;
      }
      socketRef.current = ws;

      ws.onopen = () => {
        attemptsRef.current = 0;
        setConnected(true);
      };

      ws.onmessage = (event) => {
        let data;
        try {
          if (typeof event.data !== 'string') return;
          data = JSON.parse(event.data);
        } catch (e) {
          return; // ignore malformed frame
        }
        if (!data || typeof data.type !== 'string') return;
        if (data.type === 'PING') {
          // Heartbeat reply so the server keeps this client alive.
          try { ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() })); } catch (e) {}
          return;
        }
        if (data.type === 'PONG') return;
        if (data.type === 'LIVE_STATS' || data.type === 'CONNECTED') {
          if (data.active_visitors !== undefined) {
            setActiveVisitors(data.active_visitors);
          }
          return;
        }
        if (PRODUCT_EVENT_TYPES.includes(data.type)) {
          // Surfaced for storefront refetch; no toast.
          const id = data.id ?? data.product_id ?? data.product?.id;
          setLastProductUpdate({ id, type: data.type, at: Date.now() });
          return;
        }
        if (NOTIFICATION_TYPES.includes(data.type)) {
          pushNotification(data);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        scheduleReconnect();
      };

      ws.onerror = () => {
        try { ws.close(); } catch (e) {}
      };
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        try { socketRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  const clearNotification = () => setLastNotification(null);

  return (
    <SocketContext.Provider value={{ activeVisitors, connected, lastNotification, notificationCount, clearNotification, lastProductUpdate }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
