const { getDatabase } = require('../db/mongo');

const ITEMS_COLLECTION = 'warehouseItems';
const MOVEMENTS_COLLECTION = 'warehouseMovements';

async function ensureIndexes() {
  const db = await getDatabase();
  await db.collection(ITEMS_COLLECTION).createIndex({ customerId: 1 });
  await db.collection(MOVEMENTS_COLLECTION).createIndex({ itemId: 1 });
  await db.collection(MOVEMENTS_COLLECTION).createIndex({ customerId: 1 });
  await db.collection(MOVEMENTS_COLLECTION).createIndex({ date: 1 });
}

async function getWarehouseItems() {
  const db = await getDatabase();
  const docs = await db.collection(ITEMS_COLLECTION).find({}).toArray();
  return (docs || []).map(d => ({
    id: d._id,
    customerId: d.customerId || '',
    description: d.description || '',
    quantity: d.quantity ?? null,
    dailyStoragePrice: d.dailyStoragePrice ?? null,
    arrivedAt: d.arrivedAt || null,
    departedAt: d.departedAt || null,
  }));
}

async function getWarehouseMovements() {
  const db = await getDatabase();
  const docs = await db.collection(MOVEMENTS_COLLECTION).find({}).toArray();
  return (docs || []).map(d => ({
    id: d._id,
    itemId: d.itemId || '',
    customerId: d.customerId || '',
    date: d.date || null,
    quantity: d.quantity ?? null,
    type: d.type || '',
  }));
}

module.exports = {
  ensureIndexes,
  getWarehouseItems,
  getWarehouseMovements,
};
