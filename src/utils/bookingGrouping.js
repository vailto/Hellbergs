/**
 * Booking grouping utilities
 * Pure functions for grouping bookings and blocks for display
 */

import { compareBookings } from './bookingSorters';
import { filterByTab } from './bookingFilters';

/**
 * Get display rows: individual bookings + blocks
 * Groups bookings by blockId and creates display rows
 * @param {array} bookings - All bookings
 * @param {array} bookingBlocks - All booking blocks
 * @param {string} currentTab - Current tab filter
 * @param {string} sortField - Sort field
 * @param {string} sortDirection - Sort direction
 * @param {object} data - Application data
 * @returns {array} Array of display rows ({type: 'booking', booking} or {type: 'block', block, bookings})
 */
export function getDisplayRows(bookings, bookingBlocks, currentTab, sortField, sortDirection, data) {
  const filtered = bookings.filter(b => filterByTab(b, currentTab));
  const standalone = filtered.filter(b => !b.blockId);
  const blockIds = [...new Set(filtered.map(b => b.blockId).filter(Boolean))];
  
  const blockRows = blockIds.map(blockId => {
    const block = bookingBlocks.find(bl => bl.id === blockId);
    const blockBookings = filtered.filter(b => b.blockId === blockId);
    return block && blockBookings.length ? { type: 'block', block, bookings: blockBookings } : null;
  }).filter(Boolean);
  
  const rows = [
    ...standalone.map(b => ({ type: 'booking', booking: b })),
    ...blockRows
  ];
  
  return rows.sort((ra, rb) => {
    const bookA = ra.type === 'booking' ? ra.booking : ra.bookings[0];
    const bookB = rb.type === 'booking' ? rb.booking : rb.bookings[0];
    return compareBookings(bookA, bookB, sortField, sortDirection, data);
  });
}

/**
 * Get flat list of rows to render (includes expanded block bookings)
 * @param {array} bookings - All bookings
 * @param {array} bookingBlocks - All booking blocks
 * @param {string} currentTab - Current tab filter
 * @param {string} sortField - Sort field
 * @param {string} sortDirection - Sort direction
 * @param {string} expandedBlockId - Currently expanded block ID (null if none)
 * @param {object} data - Application data
 * @returns {array} Flat array of rows to render
 */
export function getRowsToRender(bookings, bookingBlocks, currentTab, sortField, sortDirection, expandedBlockId, data) {
  const displayRows = getDisplayRows(bookings, bookingBlocks, currentTab, sortField, sortDirection, data);
  const out = [];
  
  for (const row of displayRows) {
    if (row.type === 'booking') {
      out.push({ type: 'booking', booking: row.booking, isInBlock: false });
    } else {
      out.push({ type: 'block', block: row.block, bookings: row.bookings });
      if (expandedBlockId === row.block.id) {
        for (const b of row.bookings) {
          out.push({ type: 'booking', booking: b, isInBlock: true });
        }
      }
    }
  }
  
  return out;
}
