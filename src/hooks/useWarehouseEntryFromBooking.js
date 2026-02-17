import { useState, useCallback } from 'react';
import { createWarehouseItemWithInMovement } from '../services/warehouseService';

const defaultWarehouseCreate = () => ({
  enabled: false,
  description: '',
  quantity: '',
  arrivedAt: '',
  dailyStoragePrice: '',
});

const defaultMottagetGodsForm = () => ({
  customerId: '',
  description: '',
  quantity: '',
  arrivedAt: new Date().toISOString().split('T')[0],
  dailyStoragePrice: '',
});

/**
 * Owns form state for warehouse entry actions around bookings:
 * - "Skapa lagervara" checkbox + fields on booking form (warehouseCreate)
 * - "Mottaget gods" modal form
 * Provides helpers to build payloads. No business logic; UI only.
 */
export function useWarehouseEntryFromBooking() {
  const [warehouseCreate, setWarehouseCreateState] = useState(defaultWarehouseCreate());
  const [showMottagetGodsModal, setShowMottagetGodsModal] = useState(false);
  const [mottagetGodsForm, setMottagetGodsForm] = useState(defaultMottagetGodsForm());

  const setWarehouseCreateField = useCallback((name, value) => {
    setWarehouseCreateState(prev => ({ ...prev, [name]: value }));
  }, []);

  const setWarehouseCreateEnabled = useCallback((enabled, bookingDate) => {
    setWarehouseCreateState(prev => ({
      ...prev,
      enabled,
      arrivedAt: enabled && bookingDate ? bookingDate : prev.arrivedAt,
    }));
  }, []);

  const getWarehouseCreatePayload = useCallback(
    bookingDate => ({
      enabled: warehouseCreate.enabled,
      description: (warehouseCreate.description || '').trim(),
      quantity: (warehouseCreate.quantity || '').trim(),
      arrivedAt: (warehouseCreate.arrivedAt || bookingDate || '').trim(),
      dailyStoragePrice: (warehouseCreate.dailyStoragePrice || '').trim(),
    }),
    [warehouseCreate]
  );

  const resetWarehouseCreate = useCallback(() => {
    setWarehouseCreateState(defaultWarehouseCreate());
  }, []);

  const setMottagetGodsField = useCallback((name, value) => {
    setMottagetGodsForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const submitMottagetGods = useCallback(async () => {
    const qty = Number(mottagetGodsForm.quantity);
    const priceRaw = mottagetGodsForm.dailyStoragePrice;
    const price = priceRaw !== '' && priceRaw != null ? Number(priceRaw) : undefined;
    const payload = {
      customerId: (mottagetGodsForm.customerId || '').trim(),
      description: (mottagetGodsForm.description || '').trim(),
      quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
      arrivedAt: (mottagetGodsForm.arrivedAt || '').trim(),
      dailyStoragePrice: Number.isFinite(price) ? price : undefined,
    };
    try {
      await createWarehouseItemWithInMovement(payload);
      setMottagetGodsForm(defaultMottagetGodsForm());
      setShowMottagetGodsModal(false);
    } catch (error) {
      console.error('Mottaget gods: kunde inte skapa lagervara', error);
    }
  }, [mottagetGodsForm]);

  const closeMottagetGodsModal = useCallback(() => {
    setShowMottagetGodsModal(false);
    setMottagetGodsForm(defaultMottagetGodsForm());
  }, []);

  return {
    warehouseCreate,
    setWarehouseCreateField,
    setWarehouseCreateEnabled,
    getWarehouseCreatePayload,
    resetWarehouseCreate,
    showMottagetGodsModal,
    setShowMottagetGodsModal,
    mottagetGodsForm,
    setMottagetGodsField,
    submitMottagetGods,
    closeMottagetGodsModal,
  };
}

export default useWarehouseEntryFromBooking;
