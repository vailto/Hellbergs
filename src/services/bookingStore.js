// Booking API service
// Handles communication with backend /api/bookings endpoints

const API_BASE = '/api/bookings';

export async function getAllBookings() {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error(`Failed to fetch bookings: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
}

export async function upsertBooking(booking) {
  if (!booking.id) {
    throw new Error('Booking must have an id');
  }

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking),
    });

    if (!response.ok) {
      throw new Error(`Failed to save booking: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving booking:', error);
    throw error;
  }
}

export async function deleteBooking(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete booking: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
}
