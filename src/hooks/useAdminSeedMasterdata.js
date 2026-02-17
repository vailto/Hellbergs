import { useState, useCallback } from 'react';
import { seedMasterdata } from '../services/adminService';

/**
 * State and action for seeding masterdata via POST /api/admin/seed/masterdata.
 * Token is kept in state only (not persisted).
 */
export function useAdminSeedMasterdata({ onSuccess }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const runSeed = useCallback(async () => {
    const t = (token || '').trim();
    if (!t) {
      setError('Ange token');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await seedMasterdata({ token: t });
      setResult(data);
      if (typeof onSuccess === 'function') {
        onSuccess(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seed misslyckades');
    } finally {
      setLoading(false);
    }
  }, [token, onSuccess]);

  return {
    token,
    setToken,
    loading,
    error,
    result,
    runSeed,
  };
}
