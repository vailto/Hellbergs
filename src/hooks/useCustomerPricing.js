import { useState, useEffect, useCallback } from 'react';
import { fetchPricing, upsertPricingRow, deletePricingRow } from '../services/pricingService';

export function useCustomerPricing() {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchPricing()
      .then(data => setPricing(Array.isArray(data) ? data : []))
      .catch(err => setError(err instanceof Error ? err.message : 'Kunde inte ladda priser.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getPricingForCustomer = useCallback(
    customerId => {
      return (pricing || [])
        .filter(row => row.customerId === customerId)
        .sort((a, b) => (b.validFrom || '').localeCompare(a.validFrom || ''));
    },
    [pricing]
  );

  const savePricingRow = useCallback(
    async (customerId, validFrom, row) => {
      setSaving(true);
      setSaveError(null);
      try {
        await upsertPricingRow({ customerId, validFrom, row });
        await load();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Kunde inte spara.');
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const removePricingRow = useCallback(
    async (customerId, validFrom) => {
      setSaving(true);
      setSaveError(null);
      try {
        await deletePricingRow({ customerId, validFrom });
        await load();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Kunde inte ta bort.');
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  return {
    pricing,
    loading,
    error,
    saving,
    saveError,
    getPricingForCustomer,
    savePricingRow,
    deletePricingRow: removePricingRow,
  };
}
