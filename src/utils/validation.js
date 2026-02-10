// Validation utilities

export const validateDate = (dateStr) => {
  if (!dateStr) return 'Datum krävs';
  
  // Check format yyyy-mm-dd
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return 'Ogiltigt datumformat (använd yyyy-mm-dd)';
  }
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return 'Ogiltigt datum';
  }
  
  return null;
};

export const validateTime = (timeStr) => {
  if (!timeStr) return 'Tid krävs';
  
  // Check format hh:mm
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(timeStr)) {
    return 'Ogiltigt tidsformat (använd hh:mm)';
  }
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return 'Ogiltig tid';
  }
  
  return null;
};

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} krävs`;
  }
  return null;
};

export const validateNumber = (value, fieldName, min = 0) => {
  if (value === null || value === undefined || value === '') {
    return null; // Optional field
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return `${fieldName} måste vara ett giltigt nummer`;
  }
  
  if (num < min) {
    return `${fieldName} måste vara minst ${min}`;
  }
  
  return null;
};

export const validateBooking = (booking) => {
  const errors = {};
  
  // Customer
  if (!booking.customerId) {
    errors.customerId = 'Kund krävs';
  }
  
  // Pickup address
  if (!booking.pickupAddress?.trim()) {
    errors.pickupAddress = 'Upphämtningsadress krävs';
  }
  
  // Pickup date
  const pickupDateError = validateDate(booking.pickupDate);
  if (pickupDateError) errors.pickupDate = pickupDateError;
  
  // Pickup time
  const pickupTimeError = validateTime(booking.pickupTime);
  if (pickupTimeError) errors.pickupTime = pickupTimeError;
  
  // Delivery address
  if (!booking.deliveryAddress?.trim()) {
    errors.deliveryAddress = 'Leveransadress krävs';
  }
  
  // Delivery date
  const deliveryDateError = validateDate(booking.deliveryDate);
  if (deliveryDateError) errors.deliveryDate = deliveryDateError;
  
  // Delivery time
  const deliveryTimeError = validateTime(booking.deliveryTime);
  if (deliveryTimeError) errors.deliveryTime = deliveryTimeError;

  // vehicleId, driverId, km, amountSek are optional – set in Planning / cost entry
  return Object.keys(errors).length > 0 ? errors : null;
};

