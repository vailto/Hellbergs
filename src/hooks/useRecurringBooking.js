import { useState, useRef, useEffect } from 'react';
import { generateId, generateBookingNumber } from '../utils/formatters';
import { createRecurringRule } from '../services/recurringRulesService';
import { createWarehouseItemWithInMovement } from '../services/warehouseService';

const MESSAGE_DURATION_MS = 5000;

/**
 * Build template booking for recurring rule: strip recurring fields and identity fields.
 * Backend generates bookingNo per occurrence; frontend sequence is not consumed.
 */
function buildTemplateBooking(bookingData) {
  const {
    recurringEnabled: _recurringEnabled,
    repeatWeeks: _repeatWeeks,
    weeksAhead: _weeksAhead,
    id: _id,
    bookingNo: _bookingNo,
    ...templateBooking
  } = bookingData;
  return templateBooking;
}

export function useRecurringBooking({
  data,
  updateData,
  saveBookingToApi,
  resetForm,
  setShowForm,
}) {
  const [recurringMessage, setRecurringMessage] = useState(null);
  const messageTimerRef = useRef(null);

  const clearMessageTimer = () => {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }
  };

  const showRecurringMessage = created => {
    clearMessageTimer();
    setRecurringMessage(`Skapade ${created} återkommande bokningar`);
    messageTimerRef.current = setTimeout(() => {
      setRecurringMessage(null);
      messageTimerRef.current = null;
    }, MESSAGE_DURATION_MS);
  };

  useEffect(() => {
    return () => clearMessageTimer();
  }, []);

  const saveBookingWithRecurring = async bookingData => {
    if (bookingData.recurringEnabled) {
      if (!bookingData.pickupDate) {
        alert('Välj pickup-datum innan du skapar återkommande bokningar.');
        return;
      }
      try {
        const templateBooking = buildTemplateBooking(bookingData);
        const repeatWeeks = Number(bookingData.repeatWeeks) || 1;
        const weeksAhead = Number(bookingData.weeksAhead) || 12;

        const result = await createRecurringRule({
          templateBooking,
          startDate: bookingData.pickupDate,
          repeatWeeks,
          weeksAhead,
        });

        const created = result?.generated?.created ?? 0;
        showRecurringMessage(created);
        // Recurring bookingNo is generated server-side; frontend lastBookingNumber sequence is not consumed.
        resetForm();
        setShowForm(false);
      } catch {
        alert('Kunde inte skapa återkommande bokningar. Försök igen.');
      }
    } else {
      const { bookingNo, lastBookingNumber } = generateBookingNumber(data.lastBookingNumber);
      const newBooking = {
        ...bookingData,
        id: generateId('bk'),
        bookingNo,
      };
      try {
        const saved = await saveBookingToApi(newBooking);
        updateData({ lastBookingNumber });
        if (bookingData.warehouseCreate?.enabled) {
          try {
            const wc = bookingData.warehouseCreate;
            const qty = Number(wc.quantity);
            const dsp = wc.dailyStoragePrice;
            const dspNum = dsp !== '' && dsp != null ? Number(dsp) : undefined;
            await createWarehouseItemWithInMovement({
              customerId: newBooking.customerId || '',
              description: (wc.description || '').trim() || (newBooking.note || '').trim() || '',
              quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
              arrivedAt: (wc.arrivedAt || '').trim() || newBooking.pickupDate || '',
              dailyStoragePrice: Number.isFinite(dspNum) ? dspNum : undefined,
              bookingId: saved?.id ?? newBooking.id,
            });
          } catch (whErr) {
            console.error('Bokning sparad men lagervara kunde inte skapas', whErr);
          }
        }
        resetForm();
        setShowForm(false);
      } catch {
        alert('Kunde inte spara bokning. Försök igen.');
      }
    }
  };

  return { saveBookingWithRecurring, recurringMessage };
}

export default useRecurringBooking;
