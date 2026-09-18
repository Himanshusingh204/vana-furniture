import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../lib/api';

// Single product by id.
export function useProduct(id) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(async () => {
    if (!id) {
      setProduct(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiGet(`/api/products/${encodeURIComponent(id)}`);
      setProduct((res && res.data) || null);
    } catch (err) {
      setError((err && err.message) || 'Failed to load product.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch, reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  return { product, loading, error, retry, refetch };
}

export default useProduct;
