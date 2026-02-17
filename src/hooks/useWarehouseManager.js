import { useState, useEffect, useCallback } from 'react';
import {
  fetchWarehouse,
  createWarehouseItem,
  updateWarehouseItem,
  deleteWarehouseItem,
  addWarehouseMovement,
  fetchWarehouseEstimate,
} from '../services/warehouseService';

export function useWarehouseManager() {
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchWarehouse()
      .then(data => {
        setItems(Array.isArray(data?.items) ? data.items : []);
        setMovements(Array.isArray(data?.movements) ? data.movements : []);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Kunde inte ladda lager.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createItem = useCallback(
    async data => {
      setSaving(true);
      setError(null);
      try {
        await createWarehouseItem(data);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kunde inte skapa.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const updateItem = useCallback(
    async (itemId, patch) => {
      setSaving(true);
      setError(null);
      try {
        await updateWarehouseItem({ itemId, patch });
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kunde inte uppdatera.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const deleteItem = useCallback(
    async itemId => {
      setSaving(true);
      setError(null);
      try {
        await deleteWarehouseItem({ itemId });
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kunde inte ta bort.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const addMovement = useCallback(
    async (itemId, movement) => {
      setSaving(true);
      setError(null);
      try {
        await addWarehouseMovement({ itemId, movement });
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kunde inte registrera.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const getEstimate = useCallback(async itemId => {
    return fetchWarehouseEstimate({ itemId });
  }, []);

  return {
    items,
    movements,
    loading,
    error,
    saving,
    createItem,
    updateItem,
    deleteItem,
    addMovement,
    getEstimate,
    refetch: load,
  };
}
