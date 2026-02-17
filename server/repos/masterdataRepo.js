const { getDatabase } = require('../db/mongo');

const CUSTOMERS_COLLECTION = 'customers';
const VEHICLES_COLLECTION = 'vehicles';
const DRIVERS_COLLECTION = 'drivers';

function toId(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

async function ensureIndexes() {
  const db = await getDatabase();
  await db.collection(CUSTOMERS_COLLECTION).createIndex(
    { key: 1 },
    { unique: true, sparse: true }
  );
  await db.collection(VEHICLES_COLLECTION).createIndex(
    { code: 1 },
    { unique: true }
  );
  await db.collection(DRIVERS_COLLECTION).createIndex(
    { code: 1 },
    { unique: true }
  );
}

async function getAllMasterdata() {
  const db = await getDatabase();
  const [customers, vehicles, drivers] = await Promise.all([
    db.collection(CUSTOMERS_COLLECTION).find({}).toArray(),
    db.collection(VEHICLES_COLLECTION).find({}).toArray(),
    db.collection(DRIVERS_COLLECTION).find({}).toArray(),
  ]);
  return {
    customers: customers.map(toId).map(c => ({ ...c, active: c.active !== false })),
    vehicles: vehicles.map(toId).map(v => ({
      ...v,
      driverIds: v.driverIds || [],
      active: v.active !== false,
    })),
    drivers: drivers.map(toId).map(d => ({
      ...d,
      vehicleIds: d.vehicleIds || [],
      active: d.active !== false,
    })),
  };
}

function customerKey(name) {
  const s = (name || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_åäö]/gi, '');
  return s || undefined;
}

async function seedCustomers(customersList) {
  const db = await getDatabase();
  const coll = db.collection(CUSTOMERS_COLLECTION);
  const ops = customersList.map((c, i) => {
    const key = customerKey(c.name) || `cust_${i}`;
    const doc = {
      _id: key,
      key,
      name: c.name || '',
      address: c.address || '',
      city: c.city || '',
      active: true,
    };
    return {
      updateOne: {
        filter: { _id: key },
        update: { $set: doc },
        upsert: true,
      },
    };
  });
  if (ops.length === 0) return { upsertedCount: 0 };
  const result = await coll.bulkWrite(ops);
  return { upsertedCount: (result.upsertedCount || 0) + (result.modifiedCount || 0) };
}

async function seedVehicles(vehiclesList) {
  const db = await getDatabase();
  const coll = db.collection(VEHICLES_COLLECTION);
  const ops = vehiclesList.map(v => {
    const code = String(v.code ?? '').trim();
    const doc = {
      _id: code,
      code,
      regNo: v.regNo || '',
      driverIds: [],
      active: true,
    };
    return {
      updateOne: {
        filter: { _id: code },
        update: { $set: doc },
        upsert: true,
      },
    };
  });
  if (ops.length === 0) return { upsertedCount: 0 };
  const result = await coll.bulkWrite(ops);
  return { upsertedCount: (result.upsertedCount || 0) + (result.modifiedCount || 0) };
}

async function seedDrivers(driversList) {
  const db = await getDatabase();
  const coll = db.collection(DRIVERS_COLLECTION);
  const ops = driversList.map(d => {
    const code = String(d.code ?? '').trim();
    const doc = {
      _id: code,
      code,
      name: d.name || '',
      vehicleIds: [],
      active: true,
    };
    return {
      updateOne: {
        filter: { _id: code },
        update: { $set: doc },
        upsert: true,
      },
    };
  });
  if (ops.length === 0) return { upsertedCount: 0 };
  const result = await coll.bulkWrite(ops);
  return { upsertedCount: (result.upsertedCount || 0) + (result.modifiedCount || 0) };
}

module.exports = {
  ensureIndexes,
  getAllMasterdata,
  seedCustomers,
  seedVehicles,
  seedDrivers,
};
