const warehouseRepo = require('../repos/warehouseRepo');
const warehouseMovementRepo = require('../repos/warehouseMovementRepo');

const VALID_TYPES = ['IN', 'OUT', 'ADJUST'];
const IN_ALIASES = ['ADD', 'ARRIVE', 'RECEIVE', 'RECEIVED'];
const OUT_ALIASES = ['REMOVE', 'DEPART', 'SHIP', 'SHIPPED'];

function normalizeMovementType(t) {
  if (t == null || t === '') return 'ADJUST';
  const upper = String(t).trim().toUpperCase();
  if (VALID_TYPES.includes(upper)) return upper;
  if (IN_ALIASES.includes(upper)) return 'IN';
  if (OUT_ALIASES.includes(upper)) return 'OUT';
  return 'ADJUST';
}

async function listWarehouse() {
  const [items, movements] = await Promise.all([
    warehouseRepo.getWarehouseItems(),
    warehouseRepo.getWarehouseMovements(),
  ]);
  const normalizedMovements = (movements || []).map(m => ({
    ...m,
    type: normalizeMovementType(m.type),
  }));
  return { items, movements: normalizedMovements };
}

/**
 * Create warehouse item and initial IN movement. Idempotent when bookingId is provided.
 * @returns {{ item: object, movement: object }}
 */
async function createItemWithInMovement(payload) {
  const {
    customerId,
    description,
    quantity,
    arrivedAt,
    dailyStoragePrice,
    bookingId,
  } = payload;

  if (bookingId) {
    const existing = await warehouseMovementRepo.findMovementByBookingIdAndType(
      bookingId,
      'IN'
    );
    if (existing) {
      const item = await warehouseRepo.getItemById(existing.warehouseItemId);
      if (item) return { item, movement: existing };
    }
  }

  const itemDoc = await warehouseRepo.insertItem({
    customerId,
    description,
    quantity: Number(quantity),
    currentQuantity: Number(quantity),
    arrivedAt: arrivedAt || null,
    dailyStoragePrice: dailyStoragePrice != null ? Number(dailyStoragePrice) : null,
  });

  try {
    const movementDoc = await warehouseMovementRepo.insertMovement({
      warehouseItemId: itemDoc._id,
      type: 'IN',
      quantity: Number(quantity),
      date: arrivedAt || new Date().toISOString().split('T')[0],
      bookingId: bookingId || null,
      customerId: customerId || null,
    });
    const movement = warehouseMovementRepo.mapMovementDoc(movementDoc);
    const item = await warehouseRepo.getItemById(itemDoc._id);
    return { item, movement };
  } catch (err) {
    if (err.code === 11000 && bookingId) {
      const existing = await warehouseMovementRepo.findMovementByBookingIdAndType(
        bookingId,
        'IN'
      );
      if (existing) {
        const item = await warehouseRepo.getItemById(existing.warehouseItemId);
        if (item) return { item, movement: existing };
      }
    }
    throw err;
  }
}

/**
 * Create movement and update item currentQuantity. OUT must not go below 0.
 * @returns {{ movement: object, item: object }}
 */
async function createMovement(payload) {
  const { warehouseItemId, type, quantity, date, bookingId } = payload;
  const qty = Number(quantity);
  const upperType = String(type).trim().toUpperCase();
  if (upperType !== 'IN' && upperType !== 'OUT') {
    const err = new Error('type must be IN or OUT');
    err.statusCode = 400;
    throw err;
  }

  const item = await warehouseRepo.getItemById(warehouseItemId);
  if (!item) {
    const err = new Error('Warehouse item not found');
    err.statusCode = 404;
    throw err;
  }

  const current = Number(item.currentQuantity) || 0;
  if (upperType === 'OUT' && qty > current) {
    const err = new Error('Insufficient quantity: would go below 0');
    err.statusCode = 400;
    throw err;
  }

  const movementDoc = await warehouseMovementRepo.insertMovement({
    warehouseItemId,
    type: upperType,
    quantity: qty,
    date: date || new Date().toISOString().split('T')[0],
    bookingId: bookingId || null,
    customerId: item.customerId || null,
  });

  const newQuantity = upperType === 'IN' ? current + qty : current - qty;
  await warehouseRepo.updateItemCurrentQuantity(warehouseItemId, newQuantity);

  const movement = warehouseMovementRepo.mapMovementDoc(movementDoc);
  const updatedItem = await warehouseRepo.getItemById(warehouseItemId);
  return { movement, item: updatedItem };
}

module.exports = {
  listWarehouse,
  normalizeMovementType,
  createItemWithInMovement,
  createMovement,
};
