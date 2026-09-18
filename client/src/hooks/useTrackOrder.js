import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../lib/api';

// Public buyer tracking: sanitized lookup + test-mode payment (intent/confirm).
export function useTrackOrder(initialOrderNumber) {
  const [query, setQuery] = useState(initialOrderNumber || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payState, setPayState] = useState({ working: false, intent: null, done: false, error: '' });
  const [payMethod, setPayMethod] = useState('upi');

  const lookup = useCallback(async (orderNumber) => {
    const id = String(orderNumber ?? '').trim();
    if (!id) {
      setError('Enter your order number, e.g. JOD-ORD-2026-0081.');
      return null;
    }
    setLoading(true);
    setError('');
    setOrder(null);
    setPayState({ working: false, intent: null, done: false, error: '' });
    try {
      const json = await apiGet(`/api/orders/${encodeURIComponent(id)}`);
      const found = (json && json.data) || null;
      if (!found) throw new Error('Order not found.');
      setOrder(found);
      return found;
    } catch (err) {
      setError((err && err.message) || 'Could not find that order.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialOrderNumber) lookup(initialOrderNumber);
  }, [initialOrderNumber, lookup]);

  // Back-compat signatures:
  //   createIntent(method) | createIntent(method, email, phone) | createIntent({ method, email, phone })
  // Server requires email+phone matching the order (or admin token), so include
  // explicit args when given, else fall back to looked-up order fields when known.
  const createIntent = useCallback(
    async (methodOrOpts, email, phone) => {
      if (!order) throw new Error('No order loaded.');
      let method = payMethod;
      let em = email;
      let ph = phone;
      if (methodOrOpts && typeof methodOrOpts === 'object') {
        method = methodOrOpts.method || payMethod;
        if (em === undefined) em = methodOrOpts.email;
        if (ph === undefined) ph = methodOrOpts.phone;
      } else if (methodOrOpts !== undefined) {
        method = methodOrOpts;
      }
      if (em === undefined) em = order.customer_email || order.email;
      if (ph === undefined) ph = order.customer_phone || order.phone;
      const body = {
        order_number: order.order_number,
        method: method || payMethod,
      };
      if (em !== undefined && em !== '') body.email = em;
      if (ph !== undefined && ph !== '') body.phone = ph;
      const json = await apiPost('/api/payments/intent', body);
      return (json && json.data) || json;
    },
    [order, payMethod]
  );

  const confirmPayment = useCallback(async (intentId) => {
    const json = await apiPost('/api/payments/confirm', { intent_id: intentId });
    return (json && json.data) || json;
  }, []);

  const startTestPayment = useCallback(async (overrides) => {
    if (!order) return;
    setPayState({ working: true, intent: null, done: false, error: '' });
    try {
      const intent = await createIntent(overrides || {});
      const confirmed = await confirmPayment(intent && intent.id);
      setPayState({ working: false, intent: confirmed, done: true, error: '' });
      await lookup(order.order_number);
    } catch (err) {
      setPayState({ working: false, intent: null, done: false, error: (err && err.message) || 'Payment failed.' });
    }
  }, [order, createIntent, confirmPayment, lookup]);

  return {
    query,
    setQuery,
    order,
    loading,
    error,
    lookup,
    payState,
    payMethod,
    setPayMethod,
    createIntent,
    confirmPayment,
    startTestPayment,
  };
}

export default useTrackOrder;
