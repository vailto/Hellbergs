const { getDatabase } = require('../db/mongo');

const COLLECTION = 'customerPricing';

async function ensureIndexes() {
  const db = await getDatabase();
  await db.collection(COLLECTION).createIndex(
    { customerId: 1, validFrom: 1 },
    { unique: true, sparse: true }
  );
}

async function getCustomerPricing() {
  const db = await getDatabase();
  const docs = await db.collection(COLLECTION).find({}).toArray();
  return (docs || []).map(d => ({
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
}

module.exports = {
  ensureIndexes,
  getCustomerPricing,
};
