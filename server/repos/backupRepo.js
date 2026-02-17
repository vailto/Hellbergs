const { getDatabase } = require('../db/mongo');

const COLLECTIONS = {
  bookings: 'bookings',
  customers: 'customers',
  vehicles: 'vehicles',
  drivers: 'drivers',
};

async function exportAll() {
  const db = await getDatabase();

  const [bookingsRaw, customersRaw, vehiclesRaw, driversRaw] = await Promise.all([
    db.collection(COLLECTIONS.bookings).find({}).toArray(),
    db.collection(COLLECTIONS.customers).find({}).toArray(),
    db.collection(COLLECTIONS.vehicles).find({}).toArray(),
    db.collection(COLLECTIONS.drivers).find({}).toArray(),
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

  return {
    bookings,
    customers,
    vehicles,
    drivers,
    warehouseItems: [],
    warehouseMovements: [],
    rateCards: [],
    customerPricing: [],
  };
}

module.exports = {
  exportAll,
};
