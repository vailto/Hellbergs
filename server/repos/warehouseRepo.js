const crypto = require('crypto');
const { getDatabase } = require('../db/mongo');

const ITEMS_COLLECTION = 'warehouse_items';
const MOVEMENTS_COLLECTION = 'warehouse_movements';

function generateId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

async function ensureIndexes() {
  const db = await getDatabase();
  await db.collection(ITEMS_COLLECTION).createIndex({ customerId: 1 });
  await db.collection(MOVEMENTS_COLLECTION).createIndex({ warehouseItemId: 1, date: -1 });
  await db.collection(MOVEMENTS_COLLECTION).createIndex({ customerId: 1, date: -1 });
  await db
    .collection(MOVEMENTS_COLLECTION)
    .createIndex({ bookingId: 1, type: 1 }, { unique: true, sparse: true });
}

async function getWarehouseItems() {
  const db = await getDatabase();
  const docs = await db.collection(ITEMS_COLLECTION).find({}).toArray();
  return (docs || []).map(doc => ({
    id: doc._id,
    customerId: doc.customerId ?? '',
    description: doc.description ?? '',
    quantity: doc.quantity ?? 0,
    currentQuantity: doc.currentQuantity ?? doc.quantity ?? 0,
    dailyStoragePrice: doc.dailyStoragePrice ?? 0,
    arrivedAt: doc.arrivedAt ?? null,
    departedAt: doc.departedAt ?? null,
  }));
}

async function getWarehouseMovements() {
  const db = await getDatabase();
  const docs = await db.collection(MOVEMENTS_COLLECTION).find({}).toArray();
  return (docs || []).map(doc => ({
    id: doc._id,
    itemId: doc.warehouseItemId ?? '',
    warehouseItemId: doc.warehouseItemId ?? '',
    customerId: doc.customerId ?? '',
    date: doc.date ?? '',
    quantity: doc.quantity ?? 0,
    type: doc.type ?? '',
    bookingId: doc.bookingId ?? null,
  }));
}

async function insertItem(doc) {
  const db = await getDatabase();
  const _id = doc._id || generateId('wi');
  const now = new Date();
  const toInsert = {
    _id,
    customerId: doc.customerId ?? '',
    description: doc.description ?? '',
    quantity: doc.quantity ?? 0,
    currentQuantity: doc.currentQuantity ?? doc.quantity ?? 0,
    arrivedAt: doc.arrivedAt ?? null,
    dailyStoragePrice: doc.dailyStoragePrice ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection(ITEMS_COLLECTION).insertOne(toInsert);
  return toInsert;
}

async function getItemById(id) {
  const db = await getDatabase();
  const doc = await db.collection(ITEMS_COLLECTION).findOne({ _id: id });
  if (!doc) return null;
  return {
    id: doc._id,
    customerId: doc.customerId ?? '',
    description: doc.description ?? '',
    quantity: doc.quantity ?? 0,
    currentQuantity: doc.currentQuantity ?? doc.quantity ?? 0,
    arrivedAt: doc.arrivedAt ?? null,
    dailyStoragePrice: doc.dailyStoragePrice ?? null,
  };
}

async function updateItemCurrentQuantity(id, currentQuantity) {
  const db = await getDatabase();
  const result = await db
    .collection(ITEMS_COLLECTION)
    .updateOne({ _id: id }, { $set: { currentQuantity, updatedAt: new Date() } });
  return result.modifiedCount > 0;
}

module.exports = {
  ensureIndexes,
  getWarehouseItems,
  getWarehouseMovements,
  insertItem,
  getItemById,
  updateItemCurrentQuantity,
  ITEMS_COLLECTION,
  MOVEMENTS_COLLECTION,
};
