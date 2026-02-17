import { useState, useCallback } from 'react';

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

  const submitMottagetGods = useCallback(() => {
    const payload = {
      customerId: (mottagetGodsForm.customerId || '').trim(),
      description: (mottagetGodsForm.description || '').trim(),
      quantity: (mottagetGodsForm.quantity || '').trim(),
      arrivedAt: (mottagetGodsForm.arrivedAt || '').trim(),
      dailyStoragePrice: (mottagetGodsForm.dailyStoragePrice || '').trim(),
    };
    // TODO: call API to create warehouse item
    console.log('Mottaget gods payload (TODO):', payload);
    setMottagetGodsForm(defaultMottagetGodsForm());
    setShowMottagetGodsModal(false);
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
