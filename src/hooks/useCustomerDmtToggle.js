import { useState, useCallback } from 'react';
import { updateCustomerHasDmt } from '../services/customerService';

export function useCustomerDmtToggle({ data, updateData }) {
  const [dmtError, setDmtError] = useState(null);

  const toggleCustomerDmt = useCallback(
    async (customerId, nextValue) => {
      const prev = data.customers || [];
      const updated = prev.map(c => (c.id === customerId ? { ...c, hasDmt: !!nextValue } : c));
      updateData({ customers: updated });
      setDmtError(null);
      try {
        await updateCustomerHasDmt({ id: customerId, hasDmt: !!nextValue });
      } catch (err) {
        updateData({ customers: prev });
        setDmtError(err instanceof Error ? err.message : 'Kunde inte uppdatera DMT.');
      }
    },
    [data.customers, updateData]
  );

  return { toggleCustomerDmt, dmtError };
}
