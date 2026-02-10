/**
 * Booking sorting utilities
 * Pure functions for comparing and sorting bookings
 */

/**
 * Compare two bookings based on sort field and direction
 * @param {object} a - First booking
 * @param {object} b - Second booking
 * @param {string} sortField - Field to sort by
 * @param {string} sortDirection - 'asc' or 'desc'
 * @param {object} data - Application data (customers, vehicles, pickupLocations)
 * @returns {number} -1, 0, or 1
 */
export function compareBookings(a, b, sortField, sortDirection, data) {
  let aVal, bVal;
  
  switch (sortField) {
    case 'bookingNo':
      aVal = a.bookingNo || '';
      bVal = b.bookingNo || '';
      break;
    case 'pickupDate':
      aVal = a.pickupDate || a.date || '';
      bVal = b.pickupDate || b.date || '';
      break;
    case 'customer': {
      const customerA = data.customers.find(c => c.id === a.customerId);
      const customerB = data.customers.find(c => c.id === b.customerId);
      aVal = customerA?.name || '';
      bVal = customerB?.name || '';
      break;
    }
    case 'vehicle': {
      const vehicleA = data.vehicles.find(v => v.id === a.vehicleId);
      const vehicleB = data.vehicles.find(v => v.id === b.vehicleId);
      aVal = vehicleA?.regNo || '';
      bVal = vehicleB?.regNo || '';
      break;
    }
    case 'pickup': {
      const pickupLocA = data.pickupLocations.find(
        loc => loc.address.toLowerCase() === a.pickupAddress?.toLowerCase()
      );
      const pickupLocB = data.pickupLocations.find(
        loc => loc.address.toLowerCase() === b.pickupAddress?.toLowerCase()
      );
      aVal = pickupLocA?.name || a.pickupCity || a.pickupAddress || '';
      bVal = pickupLocB?.name || b.pickupCity || b.pickupAddress || '';
      break;
    }
    case 'delivery': {
      const deliveryLocA = data.pickupLocations.find(
        loc => loc.address.toLowerCase() === a.deliveryAddress?.toLowerCase()
      );
      const deliveryLocB = data.pickupLocations.find(
        loc => loc.address.toLowerCase() === b.deliveryAddress?.toLowerCase()
      );
      aVal = deliveryLocA?.name || a.deliveryCity || a.deliveryAddress || '';
      bVal = deliveryLocB?.name || b.deliveryCity || b.deliveryAddress || '';
      break;
    }
    case 'status':
      aVal = a.status || '';
      bVal = b.status || '';
      break;
    default:
      return 0;
  }
  
  if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
  if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
  return 0;
}

/**
 * Sort bookings array using compareBookings
 * @param {array} bookings - Array of bookings to sort
 * @param {string} sortField - Field to sort by
 * @param {string} sortDirection - 'asc' or 'desc'
 * @param {object} data - Application data
 * @returns {array} Sorted bookings (new array)
 */
export function sortBookings(bookings, sortField, sortDirection, data) {
  return [...bookings].sort((a, b) => 
    compareBookings(a, b, sortField, sortDirection, data)
  );
}
