/**
 * Swedish formatting and shared helpers: formatNumber, formatTime24, getCustomerShort, generateId, generateBookingNumber.
 * Single source for number/date/time formatting and customer display name (short).
 */

export const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  
  // Format with space as thousand separator and comma as decimal separator
  return num.toLocaleString('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  
  return num.toLocaleString('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' SEK';
};

export const parseNumber = (strValue) => {
  if (!strValue) return null;
  // Replace comma with dot and remove spaces
  const normalized = strValue.replace(/,/g, '.').replace(/\s/g, '');
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
};

export const formatDate = (dateStr) => {
  // Input/output format: yyyy-mm-dd
  return dateStr;
};

export const formatTime = (timeStr) => {
  // Input/output format: hh:mm
  return timeStr;
};

/** Nuvarande tid i 24h-format HH:mm (för formulär m.m.) */
export const getCurrentTime24 = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Tidssträng till 24h-format HH:MM (t.ex. "8:00" → "08:00", visning överallt) */
export const formatTime24 = (timeStr) => {
  if (!timeStr) return '–';
  const parts = String(timeStr).trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const h24 = h % 24;
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const generateBookingNumber = (lastBookingNumber) => {
  const currentYear = new Date().getFullYear();
  
  if (lastBookingNumber.year !== currentYear) {
    // New year, reset counter
    return {
      bookingNo: `${currentYear}-0001`,
      lastBookingNumber: { year: currentYear, number: 1 }
    };
  } else {
    // Same year, increment
    const newNumber = lastBookingNumber.number + 1;
    const paddedNumber = String(newNumber).padStart(4, '0');
    return {
      bookingNo: `${currentYear}-${paddedNumber}`,
      lastBookingNumber: { year: currentYear, number: newNumber }
    };
  }
};

export const generateId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/** Kundförkortning för tabeller: shortName om satt, annars första 6 tecken av namn. Används i Booking, Schema m.fl. */
export const getCustomerShort = (customer) => {
  if (!customer) return '–';
  const s = (customer.shortName || '').trim();
  if (s) return s;
  return (customer.name || '').slice(0, 6) || '–';
};

/** Generera förarkod från namn: "Martin Vailto" → "MAVA" (2 första + 2 sista från för-/efternamn) */
export const generateDriverCode = (name) => {
  const parts = name.trim().split(' ');
  if (parts.length < 2) {
    return name.substring(0, 4).toUpperCase();
  }
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();
};










