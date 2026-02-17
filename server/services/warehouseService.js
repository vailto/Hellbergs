const warehouseRepo = require('../repos/warehouseRepo');

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

module.exports = {
  listWarehouse,
  normalizeMovementType,
};
