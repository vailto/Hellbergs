const warehouseRepo = require('../repos/warehouseRepo');
const pricingRepo = require('../repos/pricingRepo');

async function listWarehouse() {
  const [items, movements] = await Promise.all([
    warehouseRepo.getWarehouseItems(),
    warehouseRepo.getWarehouseMovements(),
  ]);
  return { items, movements };
}

async function createWarehouseItem(data) {
  let dailyStoragePrice = data.dailyStoragePrice;
  if (dailyStoragePrice === undefined || dailyStoragePrice === null || dailyStoragePrice === '') {
    dailyStoragePrice = await pricingRepo.getLatestPricingForCustomer(data.customerId);
  } else {
    dailyStoragePrice = Number(dailyStoragePrice) || 0;
  }
  return warehouseRepo.createItem({
    customerId: data.customerId,
    description: data.description ?? '',
    initialQuantity: data.initialQuantity ?? 0,
    dailyStoragePrice,
    arrivedAt: data.arrivedAt,
  });
}

async function recordWarehouseMovement(data) {
  return warehouseRepo.addMovement(data);
}

async function editWarehouseItem(itemId, patch) {
  return warehouseRepo.updateItem(itemId, patch);
}

async function removeWarehouseItem(itemId) {
  return warehouseRepo.deleteItem(itemId);
}

/** Storage days: from arrivedAt to departedAt (or today). Inclusive of both dates. */
function daysBetween(startStr, endStr) {
  if (!startStr) return 0;
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = end.getTime() - start.getTime();
  if (diff < 0) return 0;
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
}

async function getWarehouseEstimate(itemId) {
  const item = await warehouseRepo.getItemWithId(itemId);
  if (!item) return null;
  const arrivedAt = item.arrivedAt ?? null;
  const departedAt = item.departedAt ?? null;
  const dailyStoragePrice = Number(item.dailyStoragePrice) || 0;
  const endDate = departedAt || new Date().toISOString().slice(0, 10);
  const storageDays = daysBetween(arrivedAt, endDate);
  const storageCostEstimate = storageDays * dailyStoragePrice;
  return {
    itemId: item._id,
    storageDays,
    dailyStoragePrice,
    storageCostEstimate,
    arrivedAt,
    departedAt,
  };
}

module.exports = {
  listWarehouse,
  createWarehouseItem,
  recordWarehouseMovement,
  editWarehouseItem,
  removeWarehouseItem,
  getWarehouseEstimate,
};
