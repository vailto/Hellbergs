/**
 * Compute total warehouse storage cost for a list of line items.
 * Cost per line: days (from item.arrivedAt to deliveryDate) × dailyStoragePrice × quantity.
 *
 * @param {Array<{ warehouseItemId: string, quantity: number }>} lineItems - Selected warehouse items + quantity
 * @param {string} deliveryOrPickupDate - Date string (YYYY-MM-DD) when goods leave warehouse
 * @param {Array<{ id: string, arrivedAt: string, dailyStoragePrice?: number }>} warehouseItemsList - All warehouse items from API
 * @returns {number|null} Total cost in SEK, or null if no date/items
 */
export function calcWarehouseStorageCost(lineItems, deliveryOrPickupDate, warehouseItemsList) {
  if (
    !deliveryOrPickupDate ||
    !Array.isArray(warehouseItemsList) ||
    warehouseItemsList.length === 0
  ) {
    return null;
  }
  const end = new Date(deliveryOrPickupDate);
  let total = 0;
  for (const line of lineItems || []) {
    const item = warehouseItemsList.find(i => i.id === line.warehouseItemId);
    if (!item || !item.arrivedAt) continue;
    const start = new Date(item.arrivedAt);
    const days = Math.max(0, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
    const price = Number(item.dailyStoragePrice) || 0;
    const qty = Number(line.quantity) || 0;
    total += days * price * qty;
  }
  return total;
}
