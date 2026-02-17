import { useState, useEffect } from 'react';
import { fetchPricing } from '../services/pricingService';

export function usePricing() {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchPricing()
      .then(data => {
        if (!cancelled) setPricing(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setPricing([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { pricing, loading, error };
}
