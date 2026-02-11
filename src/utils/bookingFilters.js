/**
 * Booking filtering utilities
 * Pure functions for filtering bookings by tab/status
 */

/**
 * Filter bookings by tab (status-based filtering)
 * @param {object} booking - Booking to filter
 * @param {string} currentTab - Current tab ('bokad', 'planerad', 'genomford', 'prissatt', 'fakturerad')
 * @returns {boolean} True if booking matches tab filter
 */
export function filterByTab(booking, currentTab) {
  if (currentTab === 'bokad') {
    return booking.status === 'Bokad' || (booking.status === 'Planerad' && !booking.vehicleId);
  }
  if (currentTab === 'planerad') {
    return booking.status === 'Planerad' && booking.vehicleId;
  }
  if (currentTab === 'genomford') {
    return booking.status === 'Genomförd';
  }
  if (currentTab === 'prissatt') {
    return booking.status === 'Prissatt';
  }
  if (currentTab === 'fakturerad') {
    return booking.status === 'Fakturerad';
  }
  return false;
}

/**
 * Get bookings filtered by current tab
 * @param {array} bookings - All bookings
 * @param {string} currentTab - Current tab
 * @returns {array} Filtered bookings
 */
export function getBookingsByTab(bookings, currentTab) {
  return bookings.filter(booking => filterByTab(booking, currentTab));
}
