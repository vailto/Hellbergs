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
  return (docs || []).map(doc => ({
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
  }));
}

module.exports = {
  ensureIndexes,
  getCustomerPricing,
};
