import { useState, useEffect } from 'react';
import { fetchMasterdata } from '../services/masterdataService';

/**
 * Fetches masterdata (customers, vehicles, drivers) from the API once on mount.
 * Returns { customers, vehicles, drivers, loading, error }.
 */
export function useMasterdata() {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMasterdata();
        if (!cancelled) {
          setCustomers(data.customers ?? []);
          setVehicles(data.vehicles ?? []);
          setDrivers(data.drivers ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load masterdata:', err);
          setError(err);
          setCustomers([]);
          setVehicles([]);
          setDrivers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    customers,
    vehicles,
    drivers,
    loading,
    error,
  };
}
