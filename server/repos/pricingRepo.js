const { getDatabase } = require('../db/mongo');

const COLLECTION = 'customerPricing';
// DMT: effectiveMilPrice = milPrice * (1 + dmtPercent/100) when customer.hasDmt; else milPrice. See server/utils/dmtPricing.js.

/** Normalize to ISO date string YYYY-MM-DD for storage. */
function toValidFromDateStr(v) {
  if (v == null || v === '') return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function mapRow(doc) {
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
  return (docs || []).map(mapRow);
}

async function upsertCustomerPricing(data) {
  const validFrom = toValidFromDateStr(data.validFrom);
  if (!data.customerId || !validFrom) return null;
  const db = await getDatabase();
  const coll = db.collection(COLLECTION);
  const now = new Date();
  const doc = await coll.findOneAndUpdate(
    { customerId: data.customerId, validFrom },
    {
      $set: {
        customerId: data.customerId,
        validFrom,
        dmtPercent: Number(data.dmtPercent) || 0,
        milPrice: Number(data.milPrice) || 0,
        stopPrice: Number(data.stopPrice) || 0,
        waitPrice: Number(data.waitPrice) || 0,
        hourPrice: Number(data.hourPrice) || 0,
        fixedPrice: Number(data.fixedPrice) || 0,
        dailyStoragePrice: Number(data.dailyStoragePrice) || 0,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true, returnDocument: 'after' }
  );
  return doc ? mapRow(doc) : null;
}

async function deleteCustomerPricing({ customerId, validFrom }) {
  const normalized = toValidFromDateStr(validFrom);
  if (!customerId || !normalized) return 0;
  const db = await getDatabase();
  const result = await db
    .collection(COLLECTION)
    .deleteOne({ customerId, validFrom: normalized });
  return result.deletedCount || 0;
}

module.exports = {
  ensureIndexes,
  getCustomerPricing,
  upsertCustomerPricing,
  deleteCustomerPricing,
};
