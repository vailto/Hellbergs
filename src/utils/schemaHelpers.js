/**
 * Schema/calendar utilities
 * Pure functions for date/time calculations and schema rendering
 */

/**
 * Get Monday of the week containing the given date
 * @param {string} dateStr - Date string (yyyy-mm-dd)
 * @returns {string} Monday date (yyyy-mm-dd)
 */
export function getMondayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

/**
 * Get ISO week number for a date
 * @param {Date} d - Date object
 * @returns {number} Week number (1-53)
 */
export function getWeekNumber(d) {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
}

/**
 * Convert time string to segment index for schema grid
 * Segments are 30-minute intervals starting at 06:00
 * @param {string} timeStr - Time string (HH:mm)
 * @returns {number} Segment index (0-23)
 */
export function timeToSegmentIndex(timeStr) {
  const SEGMENT_START_HOUR = 6;
  const SEGMENTS_PER_DAY = 24;

  if (!timeStr) return 0;
  const parts = String(timeStr).trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const hour = h + m / 60;
  const seg = Math.floor((hour - SEGMENT_START_HOUR) * 2); // 30-min intervals
  return Math.max(0, Math.min(SEGMENTS_PER_DAY - 1, seg));
}

/**
 * Status colors for schema booking blocks
 */
export const STATUS_COLORS = {
  Bokad: { bg: 'rgba(239, 68, 68, 0.25)', border: '#ef4444' },
  Planerad: { bg: 'rgba(234, 179, 8, 0.25)', border: '#eab308' },
  Genomförd: { bg: 'rgba(34, 197, 94, 0.25)', border: '#22c55e' },
  Prissatt: { bg: 'rgba(168, 85, 247, 0.25)', border: '#a78bfa' },
  Fakturerad: { bg: 'rgba(59, 130, 246, 0.25)', border: '#3b82f6' },
};

/**
 * Drag-and-drop constants
 */
export const DRAG_BOOKING_KEY = 'application/x-booking-id';
export const SEGMENTS_PER_DAY = 24;
export const SEGMENT_START_HOUR = 6;
