// Swedish formatting utilities

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










