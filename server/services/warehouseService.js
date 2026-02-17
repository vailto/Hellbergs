const warehouseRepo = require('../repos/warehouseRepo');

async function listWarehouse() {
  const [items, movements] = await Promise.all([
    warehouseRepo.getWarehouseItems(),
    warehouseRepo.getWarehouseMovements(),
  ]);
  return { items, movements };
}

module.exports = {
  listWarehouse,
};
