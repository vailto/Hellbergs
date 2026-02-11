const { getDatabase } = require('../db/mongo');

const COLLECTION = 'bookings';

async function getAll() {
  const db = await getDatabase();
  const bookings = await db.collection(COLLECTION).find({}).toArray();
  return bookings.map(doc => ({
    ...doc.payload,
    id: doc._id, // Use _id as the booking id
  }));
}

async function upsert(booking) {
  if (!booking.id) {
    throw new Error('Booking must have an id');
  }

  const db = await getDatabase();
  const now = new Date();

  const doc = {
    _id: booking.id,
    payload: booking,
    status: booking.status || 'Bokad',
    bookingDate: booking.pickupDate || booking.date || null,
    updatedAt: now,
  };

  // Check if exists to set createdAt
  const existing = await db.collection(COLLECTION).findOne({ _id: booking.id });
  if (!existing) {
    doc.createdAt = now;
  } else {
    doc.createdAt = existing.createdAt || now;
  }

  await db.collection(COLLECTION).replaceOne({ _id: booking.id }, doc, { upsert: true });

  return { ...booking };
}

async function deleteById(id) {
  const db = await getDatabase();
  const result = await db.collection(COLLECTION).deleteOne({ _id: id });
  return result.deletedCount > 0;
}

module.exports = {
  getAll,
  upsert,
  deleteById,
};
