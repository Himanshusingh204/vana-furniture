import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../lib/api';
import { useSocket } from '../context/SocketContext';

function toQueryString(params) {
  if (!params) return '';
  if (typeof params === 'string') return params.replace(/^\?/, '');
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
  });
  return q.toString();
}

// Catalog list: loading/error/retry + live refetch on admin product events.
export function useProducts(params) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const socketCtx = useSocket();
  const lastProductUpdate = socketCtx?.lastProductUpdate;

  const queryString = toQueryString(params);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = queryString ? `?${queryString}` : '';
      const json = await apiGet(`/api/products${qs}`);
      setProducts((json && json.data) || []);
    } catch (err) {
      setError((err && err.message) || 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    refetch();
  }, [refetch, reloadKey]);

  // Live refresh on admin edits (create/update/delete broadcasts).
  useEffect(() => {
    if (lastProductUpdate) refetch();
  }, [lastProductUpdate, refetch]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  return { products, loading, error, retry, refetch };
}

export default useProducts;
