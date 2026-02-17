import { useCallback } from 'react';
import { generateId, generateBookingNumber } from '../utils/formatters';
import { getCurrentTime24 } from '../utils/formatters';

/**
 * Build form data for a delivery booking created from a warehouse item.
 * Used to prefill the booking form when user clicks "Skapa leveransbokning".
 * Returns object matching booking form shape including id, bookingNo, warehouseItemId, invoiceCategory.
 */
export function buildPrefilledDeliveryFormData(item, quantity = 1, lastBookingNumber) {
  const today = new Date().toISOString().split('T')[0];
  const time = getCurrentTime24();
  const { bookingNo, lastBookingNumber: nextLast } = generateBookingNumber(lastBookingNumber);
  return {
    id: generateId('bk'),
    bookingNo,
    customerId: item.customerId ?? '',
    vehicleId: '',
    driverId: '',
    hasContainer: false,
    hasTrailer: false,
    containerNr: '',
    trailerNr: '',
    marking: '',
    pickupAddress: '',
    pickupPostalCode: '',
    pickupCity: '',
    pickupDate: today,
    pickupTime: time,
    pickupContactName: '',
    pickupContactPhone: '',
    deliveryAddress: '',
    deliveryPostalCode: '',
    deliveryCity: '',
    deliveryDate: today,
    deliveryTime: time,
    deliveryContactName: '',
    deliveryContactPhone: '',
    km: '',
    amountSek: '',
    costStops: '',
    costWaitHours: '',
    costDriveHours: '',
    costUseFixed: false,
    costFixedAmount: '',
    status: 'Bokad',
    note: item.description ? `Lager: ${item.description}` : '',
    recurringEnabled: false,
    repeatWeeks: 1,
    weeksAhead: 12,
    warehouseItemId: item.id,
    invoiceCategory: 'DELIVERY',
    warehouseDeliveryQuantity: quantity,
    _lastBookingNumber: nextLast,
  };
}

export function useWarehouseDeliveryBooking() {
  const getPrefilledFormData = useCallback(
    (item, quantity = 1, lastBookingNumber) =>
      buildPrefilledDeliveryFormData(item, quantity, lastBookingNumber),
    []
  );

  return { buildPrefilledFormData: getPrefilledFormData };
}

export default useWarehouseDeliveryBooking;
