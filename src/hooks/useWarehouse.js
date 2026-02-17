import { useState, useEffect } from 'react';
import { fetchWarehouse } from '../services/warehouseService';

export function useWarehouse() {
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchWarehouse()
      .then(data => {
        if (!cancelled) {
          setItems(Array.isArray(data?.items) ? data.items : []);
          setMovements(Array.isArray(data?.movements) ? data.movements : []);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Kunde inte ladda lager.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, movements, loading, error };
}
