const { getDatabase } = require('../db/mongo');

async function exportAll() {
  const db = await getDatabase();

  const [
    bookingsRaw,
    customersRaw,
    vehiclesRaw,
    driversRaw,
    customerPricingRaw,
    warehouseItemsRaw,
    warehouseMovementsRaw,
  ] = await Promise.all([
    db.collection('bookings').find({}).toArray(),
    db.collection('customers').find({}).toArray(),
    db.collection('vehicles').find({}).toArray(),
    db.collection('drivers').find({}).toArray(),
    db.collection('customerPricing').find({}).toArray(),
    db.collection('warehouseItems').find({}).toArray(),
    db.collection('warehouseMovements').find({}).toArray(),
  ]);

  const bookings = (bookingsRaw || []).map(doc => ({
    ...doc.payload,
    id: doc._id,
  }));

  const customers = (customersRaw || []).map(c => ({
    id: c._id,
    name: c.name || '',
    address: c.address || '',
    city: c.city || '',
    active: c.active !== false,
    driverIds: [],
    vehicleIds: [],
  }));

  const vehicles = (vehiclesRaw || []).map(v => ({
    id: v._id,
    code: v.code || '',
    regNo: v.regNo || '',
    active: v.active !== false,
  }));

  const drivers = (driversRaw || []).map(d => ({
    id: d._id,
    code: d.code || '',
    name: d.name || '',
    active: d.active !== false,
  }));

  const customerPricing = (customerPricingRaw || []).map(d => ({
    id: d._id,
    customerId: d.customerId || '',
    validFrom: d.validFrom || null,
    dmtPercent: d.dmtPercent ?? null,
    milPrice: d.milPrice ?? null,
    stopPrice: d.stopPrice ?? null,
    waitPrice: d.waitPrice ?? null,
    hourPrice: d.hourPrice ?? null,
    fixedPrice: d.fixedPrice ?? null,
    dailyStoragePrice: d.dailyStoragePrice ?? null,
  }));

  const warehouseItems = (warehouseItemsRaw || []).map(d => ({
    id: d._id,
    customerId: d.customerId || '',
    description: d.description || '',
    quantity: d.quantity ?? null,
    dailyStoragePrice: d.dailyStoragePrice ?? null,
    arrivedAt: d.arrivedAt || null,
    departedAt: d.departedAt || null,
  }));

  const warehouseMovements = (warehouseMovementsRaw || []).map(d => ({
    id: d._id,
    itemId: d.itemId || '',
    customerId: d.customerId || '',
    date: d.date || null,
    quantity: d.quantity ?? null,
    type: d.type || '',
  }));

  return {
    bookings,
    customers,
    vehicles,
    drivers,
    customerPricing,
    warehouseItems,
    warehouseMovements,
    rateCards: [],
  };
}

module.exports = {
  exportAll,
};
