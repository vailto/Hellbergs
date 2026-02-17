const { getDatabase } = require('../db/mongo');
const { ObjectId } = require('mongodb');

const ITEMS_COLLECTION = 'warehouseItems';
const MOVEMENTS_COLLECTION = 'warehouseMovements';

function toDateStr(d) {
  if (!d) return null;
  if (typeof d === 'string') return d.slice(0, 10);
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? null : x.toISOString().slice(0, 10);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function mapItem(doc) {
  if (!doc) return null;
  return {
    id: doc._id,
    customerId: doc.customerId ?? '',
    description: doc.description ?? '',
    quantity: doc.quantity ?? 0,
    dailyStoragePrice: doc.dailyStoragePrice ?? 0,
    arrivedAt: doc.arrivedAt ?? null,
    departedAt: doc.departedAt ?? null,
  };
}

function mapMovement(doc) {
  if (!doc) return null;
  return {
    id: doc._id,
    itemId: doc.itemId ?? '',
    customerId: doc.customerId ?? '',
    date: doc.date ?? '',
    quantity: doc.quantity ?? 0,
    type: doc.type ?? '',
    note: doc.note ?? '',
  };
}

async function ensureIndexes() {
  const db = await getDatabase();
  await db.collection(ITEMS_COLLECTION).createIndex({ customerId: 1 });
  await db.collection(MOVEMENTS_COLLECTION).createIndex({ itemId: 1, customerId: 1, date: 1 });
}

async function getWarehouseItems() {
  const db = await getDatabase();
  const docs = await db.collection(ITEMS_COLLECTION).find({}).toArray();
  return (docs || []).map(mapItem);
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
    note: doc.note ?? '',
  }));
}

async function createItem(data) {
  const db = await getDatabase();
  const coll = db.collection(ITEMS_COLLECTION);
  const movColl = db.collection(MOVEMENTS_COLLECTION);
  const now = new Date();
  const initialQty = Number(data.initialQuantity) ?? 0;
  const arrivedAt =
    data.arrivedAt != null && data.arrivedAt !== ''
      ? toDateStr(data.arrivedAt)
      : initialQty > 0
        ? todayStr()
        : null;
  const doc = {
    customerId: data.customerId ?? '',
    description: data.description ?? '',
    quantity: initialQty,
    dailyStoragePrice: Number(data.dailyStoragePrice) || 0,
    arrivedAt,
    departedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const result = await coll.insertOne(doc);
  if (initialQty > 0) {
    await movColl.insertOne({
      itemId: result.insertedId,
      customerId: doc.customerId,
      date: arrivedAt || todayStr(),
      quantity: initialQty,
      type: 'IN',
      note: data.note ?? '',
      createdAt: now,
    });
  }
  const inserted = await coll.findOne({ _id: result.insertedId });
  return mapItem(inserted);
}

function toItemId(id) {
  if (typeof id === 'string' && id.length === 24 && /^[a-f0-9]+$/i.test(id)) {
    return ObjectId.createFromHexString(id);
  }
  return id;
}

async function getItemById(itemId) {
  const db = await getDatabase();
  const id = toItemId(itemId);
  const doc = await db.collection(ITEMS_COLLECTION).findOne({ _id: id });
  return doc;
}

async function addMovement(data) {
  const db = await getDatabase();
  const itemsColl = db.collection(ITEMS_COLLECTION);
  const movColl = db.collection(MOVEMENTS_COLLECTION);
  const itemId = data.itemId;
  const item = await getItemById(itemId);
  if (!item) return { success: false, error: 'Item not found' };
  const type = (data.type || '').toUpperCase();
  if (!['IN', 'OUT', 'ADJUST'].includes(type)) {
    return { success: false, error: 'Invalid type; use IN, OUT, or ADJUST' };
  }
  const qty = Number(data.quantity) || 0;
  if (qty <= 0) return { success: false, error: 'Quantity must be positive' };
  const date = toDateStr(data.date) || todayStr();
  let nextQuantity;
  if (type === 'IN') nextQuantity = (item.quantity ?? 0) + qty;
  else if (type === 'OUT') {
    nextQuantity = (item.quantity ?? 0) - qty;
    if (nextQuantity < 0) return { success: false, error: 'Quantity would go negative' };
  } else nextQuantity = qty;

  const now = new Date();
  const movDoc = {
    itemId: item._id,
    customerId: item.customerId ?? '',
    date,
    quantity: qty,
    type,
    note: data.note ?? '',
    createdAt: now,
  };
  const movResult = await movColl.insertOne(movDoc);

  const arrivedAt =
    nextQuantity > 0 && !item.arrivedAt ? date : (item.arrivedAt ? toDateStr(item.arrivedAt) : null);
  const departedAt = nextQuantity === 0 ? date : null;

  await itemsColl.updateOne(
    { _id: item._id },
    {
      $set: {
        quantity: nextQuantity,
        arrivedAt,
        departedAt,
        updatedAt: now,
      },
    }
  );
  const updated = await itemsColl.findOne({ _id: item._id });
  const insertedMov = await movColl.findOne({ _id: movResult.insertedId });
  return {
    success: true,
    item: mapItem(updated),
    movement: mapMovement(insertedMov),
  };
}

async function updateItem(itemId, patch) {
  const db = await getDatabase();
  const id = toItemId(itemId);
  const update = { updatedAt: new Date() };
  if (patch.description !== undefined) update.description = String(patch.description ?? '');
  if (patch.dailyStoragePrice !== undefined)
    update.dailyStoragePrice = Number(patch.dailyStoragePrice) || 0;
  const doc = await db.collection(ITEMS_COLLECTION).findOneAndUpdate(
    { _id: id },
    { $set: update },
    { returnDocument: 'after' }
  );
  return doc ? mapItem(doc) : null;
}

async function deleteItem(itemId) {
  const db = await getDatabase();
  const id = toItemId(itemId);
  const movCount = await db.collection(MOVEMENTS_COLLECTION).countDocuments({ itemId });
  if (movCount > 0) return { deleted: false, error: 'Item has movements; delete not allowed' };
  const result = await db.collection(ITEMS_COLLECTION).deleteOne({ _id: id });
  return { deleted: result.deletedCount === 1 };
}

async function getItemWithId(itemId) {
  const db = await getDatabase();
  const id = toItemId(itemId);
  const doc = await db.collection(ITEMS_COLLECTION).findOne({ _id: id });
  return doc;
}

module.exports = {
  ensureIndexes,
  getWarehouseItems,
  getWarehouseMovements,
  createItem,
  addMovement,
  updateItem,
  deleteItem,
  getItemWithId,
};
