const { getDatabase } = require('../db/mongo');

const COLLECTION = 'recurringRules';

function generateId() {
  return `rr_${require('crypto').randomUUID()}`;
}

async function create({ templateBooking, startDate, repeatWeeks, weeksAhead }) {
  const db = await getDatabase();
  const now = new Date();
  const _id = generateId();
  const doc = {
    _id,
    templateBooking,
    startDate,
    repeatWeeks: Number(repeatWeeks) || 1,
    weeksAhead: Number(weeksAhead) || 12,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection(COLLECTION).insertOne(doc);
  return doc;
}

async function update(id, { templateBooking, startDate, repeatWeeks, weeksAhead }) {
  const db = await getDatabase();
  const now = new Date();
  const updateFields = {
    updatedAt: now,
  };
  if (templateBooking !== undefined) updateFields.templateBooking = templateBooking;
  if (startDate !== undefined) updateFields.startDate = startDate;
  if (repeatWeeks !== undefined) updateFields.repeatWeeks = Number(repeatWeeks) || 1;
  if (weeksAhead !== undefined) updateFields.weeksAhead = Number(weeksAhead) || 12;

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: id },
    { $set: updateFields },
    { returnDocument: 'after' }
  );
  // Driver 6+ returns the document directly; return it (not result.value).
  return result;
}

async function getById(id) {
  const db = await getDatabase();
  return db.collection(COLLECTION).findOne({ _id: id });
}

module.exports = { create, update, getById };
