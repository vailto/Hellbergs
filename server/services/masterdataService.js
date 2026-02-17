const masterdataRepo = require('../repos/masterdataRepo');
const { customers, vehicles, drivers } = require('../seed/masterdata');

async function seedMasterdata() {
  await masterdataRepo.ensureIndexes();
  const [customersResult, vehiclesResult, driversResult] = await Promise.all([
    masterdataRepo.seedCustomers(customers),
    masterdataRepo.seedVehicles(vehicles),
    masterdataRepo.seedDrivers(drivers),
  ]);
  return {
    customersUpserted: customersResult.upsertedCount,
    vehiclesUpserted: vehiclesResult.upsertedCount,
    driversUpserted: driversResult.upsertedCount,
  };
}

module.exports = {
  seedMasterdata,
};
