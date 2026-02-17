import { useCallback, useState } from 'react';
import { updateCustomerHasDmt } from '../services/customerService';

export function useCustomerDmtToggle({ data, updateData }) {
  const [dmtError, setDmtError] = useState(null);

  const toggleCustomerDmt = useCallback(
    async (customerId, nextValue) => {
      const before = Array.isArray(data?.customers) ? data.customers : [];
      setDmtError(null);

      // Optimistic update
      const optimistic = before.map(c => (c.id === customerId ? { ...c, hasDmt: !!nextValue } : c));
      updateData({ customers: optimistic });

      try {
        const updated = await updateCustomerHasDmt({ id: customerId, hasDmt: !!nextValue });
        const merged = optimistic.map(c => (c.id === customerId ? { ...c, ...updated } : c));
        updateData({ customers: merged });
      } catch (err) {
        updateData({ customers: before });
        setDmtError(err instanceof Error ? err.message : 'Kunde inte uppdatera DMT.');
      }
    },
    [data, updateData]
  );

  return { toggleCustomerDmt, dmtError };
}
