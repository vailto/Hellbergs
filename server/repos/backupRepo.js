const { getDatabase } = require('../db/mongo');

function mapCustomer(doc) {
  return {
    id: doc._id,
    name: doc.name ?? '',
    address: doc.address ?? '',
    city: doc.city ?? '',
    active: doc.active ?? true,
    driverIds: [],
    vehicleIds: [],
  };
}

function mapVehicle(doc) {
  return {
    id: doc._id,
    code: doc.code ?? '',
    regNo: doc.regNo ?? '',
    active: doc.active ?? true,
  };
}

function mapDriver(doc) {
  return {
    id: doc._id,
    code: doc.code ?? '',
    name: doc.name ?? '',
    active: doc.active ?? true,
  };
}

function mapPricing(doc) {
  return {
    id: doc._id,
    customerId: doc.customerId ?? '',
    validFrom: doc.validFrom ?? '',
    dmtPercent: doc.dmtPercent ?? 0,
    milPrice: doc.milPrice ?? 0,
    stopPrice: doc.stopPrice ?? 0,
    waitPrice: doc.waitPrice ?? 0,
    hourPrice: doc.hourPrice ?? 0,
    fixedPrice: doc.fixedPrice ?? 0,
    dailyStoragePrice: doc.dailyStoragePrice ?? 0,
  };
}

function mapWarehouseItem(doc) {
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

function mapWarehouseMovement(doc) {
  return {
    id: doc._id,
    itemId: doc.itemId ?? '',
    customerId: doc.customerId ?? '',
    date: doc.date ?? '',
    quantity: doc.quantity ?? 0,
    type: doc.type ?? '',
  };
}

async function exportAll() {
  const db = await getDatabase();

  const [
    bookingsDocs,
    customersDocs,
    vehiclesDocs,
    driversDocs,
    pricingDocs,
    warehouseItemsDocs,
    warehouseMovementsDocs,
  ] = await Promise.all([
    db.collection('bookings').find({}).toArray(),
    db.collection('customers').find({}).toArray(),
    db.collection('vehicles').find({}).toArray(),
    db.collection('drivers').find({}).toArray(),
    db.collection('customerPricing').find({}).toArray(),
    db.collection('warehouseItems').find({}).toArray(),
    db.collection('warehouseMovements').find({}).toArray(),
  ]);

  const bookings = (bookingsDocs || []).map(doc => ({
    ...(doc.payload || {}),
    id: doc._id,
  }));

  return {
    bookings,
    customers: (customersDocs || []).map(mapCustomer),
    vehicles: (vehiclesDocs || []).map(mapVehicle),
    drivers: (driversDocs || []).map(mapDriver),
    customerPricing: (pricingDocs || []).map(mapPricing),
    warehouseItems: (warehouseItemsDocs || []).map(mapWarehouseItem),
    warehouseMovements: (warehouseMovementsDocs || []).map(mapWarehouseMovement),
    rateCards: [],
  };
}

module.exports = { exportAll };
