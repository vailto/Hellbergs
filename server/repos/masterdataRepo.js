const { getDatabase } = require('../db/mongo');

const CUSTOMERS_COLLECTION = 'customers';
const VEHICLES_COLLECTION = 'vehicles';
const DRIVERS_COLLECTION = 'drivers';

function normalizeName(name) {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_åäö]/gi, '');
}

function customerKeyFromSeedRow(c) {
  const externalId = (c?.externalId ?? '').toString().trim();
  if (externalId) return externalId;
  const nameKey = normalizeName(c?.name);
  if (!nameKey) return '';
  const addressKey = normalizeName(c?.address);
  const cityKey = normalizeName(c?.city);
  return `${nameKey}__${addressKey}__${cityKey}`;
}

async function ensureIndexes() {
  const db = await getDatabase();
  await db.collection(CUSTOMERS_COLLECTION).createIndex(
    { key: 1 },
    { unique: true, sparse: true }
  );
  await db.collection(VEHICLES_COLLECTION).createIndex(
    { regNo: 1 },
    { unique: true }
  );
  await db.collection(DRIVERS_COLLECTION).createIndex(
    { key: 1 },
    { unique: true, sparse: true }
  );
}

async function getAllDriversRaw() {
  const db = await getDatabase();
  const docs = await db
    .collection(DRIVERS_COLLECTION)
    .find({})
    .sort({ code: 1 })
    .toArray();
  return docs || [];
}

async function getAllMasterdata() {
  const db = await getDatabase();
  const [customersRaw, vehiclesRaw, driversRaw] = await Promise.all([
    db.collection(CUSTOMERS_COLLECTION).find({}).toArray(),
    db.collection(VEHICLES_COLLECTION).find({}).toArray(),
    db.collection(DRIVERS_COLLECTION).find({}).toArray(),
  ]);
  return {
    customers: (customersRaw || []).map(c => ({
      id: c._id,
      name: c.name || '',
      address: c.address || '',
      city: c.city || '',
      active: c.active !== false,
      hasDmt: c.hasDmt === true,
      driverIds: [],
      vehicleIds: [],
    })),
    vehicles: (vehiclesRaw || []).map(v => ({
      id: v._id,
      code: v.code || '',
      regNo: v.regNo || '',
      active: v.active !== false,
    })),
    drivers: (driversRaw || []).map(d => ({
      id: d._id,
      code: d.code || '',
      name: d.name || '',
      active: d.active !== false,
    })),
  };
}

async function seedCustomers(customersList) {
  const db = await getDatabase();
  const coll = db.collection(CUSTOMERS_COLLECTION);
  const now = new Date();
  const ops = [];
  for (const c of customersList) {
    const key = customerKeyFromSeedRow(c);
    // Skip rows where normalized name is empty
    if (!key) continue;
    const _id = `cust_${key}`;
    ops.push({
      updateOne: {
        filter: { key },
        update: {
          $set: {
            name: c.name || '',
            address: c.address || '',
            city: c.city || '',
            active: c.active !== false,
            hasDmt: c.hasDmt ?? false,
            key,
            updatedAt: now,
          },
          $setOnInsert: {
            _id,
            createdAt: now,
          },
        },
        upsert: true,
      },
    });
  }
  if (ops.length === 0) return { upsertedCount: 0 };
  const result = await coll.bulkWrite(ops);
  return { upsertedCount: (result.upsertedCount || 0) + (result.modifiedCount || 0) };
}

function mapCustomerDoc(c) {
  return {
    id: c._id,
    name: c.name || '',
    address: c.address || '',
    city: c.city || '',
    active: c.active !== false,
    hasDmt: c.hasDmt === true,
    driverIds: [],
    vehicleIds: [],
  };
}

async function updateCustomerHasDmt(customerId, hasDmt) {
  const db = await getDatabase();
  const coll = db.collection(CUSTOMERS_COLLECTION);
  const doc = await coll.findOneAndUpdate(
    { _id: customerId },
    { $set: { hasDmt: !!hasDmt, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!doc) return null;
  return mapCustomerDoc(doc);
}

async function seedVehicles(vehiclesList) {
  const db = await getDatabase();
  const coll = db.collection(VEHICLES_COLLECTION);
  const now = new Date();
  const ops = vehiclesList.map(v => {
    const regNo = String(v.regNo ?? '').trim();
    if (!regNo) return null;
    const code = String(v.code ?? regNo).trim();
    return {
      updateOne: {
        filter: { regNo },
        update: {
          $set: {
            code,
            regNo,
            driverIds: [],
            active: true,
            updatedAt: now,
          },
          $setOnInsert: {
            _id: regNo,
            createdAt: now,
          },
        },
        upsert: true,
      },
    };
  }).filter(Boolean);
  if (ops.length === 0) return { upsertedCount: 0 };
  const result = await coll.bulkWrite(ops);
  return { upsertedCount: (result.upsertedCount || 0) + (result.modifiedCount || 0) };
}

function driverKeyFromSeedRow(d) {
  const email = (d?.email ?? '').toString().trim();
  if (email) return email;
  const code = String(d?.code ?? '').trim();
  return code || '';
}

async function seedDrivers(driversList) {
  const db = await getDatabase();
  const coll = db.collection(DRIVERS_COLLECTION);
  const now = new Date();
  const ops = driversList.map(d => {
    const key = driverKeyFromSeedRow(d);
    if (!key) return null;
    const code = String(d.code ?? key).trim();
    return {
      updateOne: {
        filter: { key },
        update: {
          $set: {
            code,
            name: d.name || '',
            vehicleIds: [],
            active: true,
            updatedAt: now,
          },
          $setOnInsert: {
            _id: key,
            key,
            createdAt: now,
          },
        },
        upsert: true,
      },
    };
  }).filter(Boolean);
  if (ops.length === 0) return { upsertedCount: 0 };
  const result = await coll.bulkWrite(ops);
  return { upsertedCount: (result.upsertedCount || 0) + (result.modifiedCount || 0) };
}

module.exports = {
  ensureIndexes,
  getAllMasterdata,
  getAllDriversRaw,
  seedCustomers,
  seedVehicles,
  seedDrivers,
  updateCustomerHasDmt,
};
