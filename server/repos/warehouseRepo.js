const { getDatabase } = require('../db/mongo');

const ITEMS_COLLECTION = 'warehouseItems';
const MOVEMENTS_COLLECTION = 'warehouseMovements';

async function ensureIndexes() {
  const db = await getDatabase();
  await db.collection(ITEMS_COLLECTION).createIndex({ customerId: 1 });
  await db.collection(MOVEMENTS_COLLECTION).createIndex({ itemId: 1, customerId: 1, date: 1 });
}

async function getWarehouseItems() {
  const db = await getDatabase();
  const docs = await db.collection(ITEMS_COLLECTION).find({}).toArray();
  return (docs || []).map(doc => ({
    id: doc._id,
    customerId: doc.customerId ?? '',
    description: doc.description ?? '',
    quantity: doc.quantity ?? 0,
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
    itemId: doc.itemId ?? '',
    customerId: doc.customerId ?? '',
    date: doc.date ?? '',
    quantity: doc.quantity ?? 0,
    type: doc.type ?? '',
  }));
}

module.exports = {
  ensureIndexes,
  getWarehouseItems,
  getWarehouseMovements,
};
