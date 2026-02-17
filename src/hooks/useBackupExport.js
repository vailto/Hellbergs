import { useState, useCallback } from 'react';
import { exportBackup } from '../services/backupService';

export function useBackupExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const exportBackupHandler = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await exportBackup();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte ladda ner backup.');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    exportBackup: exportBackupHandler,
    loading,
    error,
  };
}
