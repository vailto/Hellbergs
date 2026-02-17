const crypto = require('crypto');
const { getDatabase } = require('../db/mongo');

const MOVEMENTS_COLLECTION = 'warehouse_movements';

function generateId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function mapMovementDoc(doc) {
  if (!doc) return null;
  return {
    id: doc._id,
    warehouseItemId: doc.warehouseItemId ?? '',
    type: doc.type ?? '',
    quantity: doc.quantity ?? 0,
    date: doc.date ?? '',
    bookingId: doc.bookingId ?? null,
    customerId: doc.customerId ?? null,
  };
}

async function insertMovement(doc) {
  const db = await getDatabase();
  const _id = doc._id || generateId('wm');
  const now = new Date();
  const toInsert = {
    _id,
    warehouseItemId: doc.warehouseItemId ?? '',
    type: doc.type ?? 'IN',
    quantity: doc.quantity ?? 0,
    date: doc.date ?? '',
    bookingId: doc.bookingId ?? null,
    customerId: doc.customerId ?? null,
    createdAt: now,
  };
  await db.collection(MOVEMENTS_COLLECTION).insertOne(toInsert);
  return toInsert;
}

async function findMovementByBookingIdAndType(bookingId, type) {
  const db = await getDatabase();
  const doc = await db
    .collection(MOVEMENTS_COLLECTION)
    .findOne({ bookingId: bookingId || null, type: type || 'IN' });
  return mapMovementDoc(doc);
}

module.exports = {
  insertMovement,
  findMovementByBookingIdAndType,
  mapMovementDoc,
  MOVEMENTS_COLLECTION,
};
