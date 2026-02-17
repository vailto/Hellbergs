const warehouseRepo = require('../repos/warehouseRepo');
const pricingRepo = require('../repos/pricingRepo');

async function listWarehouse() {
  const [items, movements] = await Promise.all([
    warehouseRepo.getWarehouseItems(),
    warehouseRepo.getWarehouseMovements(),
  ]);
  return { items, movements };
}

/**
 * Storage days from arrivedAt to toDate (inclusive of both dates).
 * E.g. arrivedAt 2025-01-01, toDate 2025-01-03 => 3 days.
 */
function storageDaysInclusive(fromStr, toStr) {
  if (!fromStr || !toStr) return 0;
  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  if (to < from) return 0;
  const diffMs = to.getTime() - from.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
}

/**
 * Build a WAREHOUSE_STORAGE invoice line for a warehouse item up to toDate.
 * dailyPrice: item.dailyStoragePrice if set, else customer's latest pricing dailyStoragePrice.
 * Storage days: arrivedAt to toDate inclusive.
 */
async function buildStorageInvoiceLine(itemId, toDate) {
  const item = await warehouseRepo.getItemWithId(itemId);
  if (!item) return null;

  let dailyPrice = Number(item.dailyStoragePrice);
  if (!(dailyPrice > 0) && item.customerId) {
    dailyPrice = await pricingRepo.getLatestPricingForCustomer(item.customerId);
  }
  dailyPrice = Number(dailyPrice) || 0;

  const fromDate = item.arrivedAt || null;
  const toStr = toDate && /^\d{4}-\d{2}-\d{2}$/.test(toDate) ? toDate : new Date().toISOString().slice(0, 10);
  const days = storageDaysInclusive(fromDate, toStr);
  const amount = days * dailyPrice;

  const description =
    (item.description && item.description.trim())
      ? `Lager: ${item.description.trim()}`
      : 'Lagerkostnad';

  return {
    type: 'WAREHOUSE_STORAGE',
    warehouseItemId: item._id,
    description,
    fromDate,
    toDate: toStr,
    days,
    dailyPrice,
    amount,
  };
}

module.exports = {
  listWarehouse,
  buildStorageInvoiceLine,
};
