const express = require('express');
const bookingRepo = require('../repos/bookingRepo');

const router = express.Router();

// GET /api/bookings - Get all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await bookingRepo.getAll();
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST /api/bookings - Upsert booking
router.post('/', async (req, res) => {
  try {
    const booking = req.body;
    
    if (!booking.id) {
      return res.status(400).json({ error: 'Booking must have an id' });
    }

    const result = await bookingRepo.upsert(booking);
    res.json(result);
  } catch (error) {
    console.error('Error upserting booking:', error);
    res.status(500).json({ error: 'Failed to save booking' });
  }
});

// DELETE /api/bookings/:id - Delete booking
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await bookingRepo.deleteById(id);
    
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Booking not found' });
    }
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

module.exports = router;
