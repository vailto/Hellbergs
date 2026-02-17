import { useState, useEffect, useCallback } from 'react';
import { fetchMasterdata } from '../services/masterdataService';

/**
 * Fetches masterdata (customers, vehicles, drivers) from the API once on mount.
 * Returns { customers, vehicles, drivers, loading, error, refresh }.
 */
export function useMasterdata() {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMasterdata();
      setCustomers(data.customers ?? []);
      setVehicles(data.vehicles ?? []);
      setDrivers(data.drivers ?? []);
      return data;
    } catch (err) {
      console.error('Failed to load masterdata:', err);
      setError(err);
      setCustomers([]);
      setVehicles([]);
      setDrivers([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load(), [load]);

  return {
    customers,
    vehicles,
    drivers,
    loading,
    error,
    refresh,
  };
}
