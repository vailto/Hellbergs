import { useState, useEffect } from 'react';
import { getAllBookings, upsertBooking, deleteBooking } from '../services/bookingStore';

/**
 * Hook to sync bookings with the backend API
 * Returns bookings array and CRUD operations
 */
export function useBookingSync() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load bookings on mount
  useEffect(() => {
    async function loadBookings() {
      try {
        setLoading(true);
        const data = await getAllBookings();
        setBookings(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load bookings:', err);
        setError(err);
        // Fallback to empty array on error
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, []);

  // Save booking to API
  const saveBooking = async booking => {
    try {
      const saved = await upsertBooking(booking);
      setBookings(prev => {
        const index = prev.findIndex(b => b.id === booking.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = saved;
          return updated;
        } else {
          return [...prev, saved];
        }
      });
      return saved;
    } catch (err) {
      console.error('Failed to save booking:', err);
      throw err;
    }
  };

  // Delete booking from API
  const removeBooking = async id => {
    try {
      await deleteBooking(id);
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Failed to delete booking:', err);
      throw err;
    }
  };

  // Bulk update bookings (for status changes, etc.)
  const updateBookings = async updatedBookings => {
    try {
      // Save all updated bookings
      const promises = updatedBookings.map(b => upsertBooking(b));
      await Promise.all(promises);
      setBookings(updatedBookings);
    } catch (err) {
      console.error('Failed to bulk update bookings:', err);
      throw err;
    }
  };

  return {
    bookings,
    loading,
    error,
    saveBooking,
    removeBooking,
    updateBookings,
  };
}
