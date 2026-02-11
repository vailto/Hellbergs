const crypto = require('crypto');
const { getDatabase } = require('../db/mongo');
const recurringRulesRepo = require('../repos/recurringRulesRepo');

/**
 * Horizon = weeks from startDate. Occurrences on same weekday as startDate,
 * step repeatWeeks*7 days, from startDate until horizonEnd (inclusive).
 * Returns array of YYYY-MM-DD strings.
 */
function getRecurrenceDates(startDate, repeatWeeks, weeksAhead) {
  const start = new Date(startDate + 'T12:00:00Z');
  if (isNaN(start.getTime())) return [];

  const horizonEnd = new Date(start);
  horizonEnd.setUTCDate(horizonEnd.getUTCDate() + weeksAhead * 7);

  const stepDays = repeatWeeks * 7;
  const dates = [];
  const current = new Date(start);

  while (current.getTime() <= horizonEnd.getTime()) {
    const y = current.getUTCFullYear();
    const m = String(current.getUTCMonth() + 1).padStart(2, '0');
    const d = String(current.getUTCDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setUTCDate(current.getUTCDate() + stepDays);
  }

  return dates;
}

/**
 * Build payload for one generated booking (clone template, override identity/dates/recurring).
 */
function buildGeneratedPayload(ruleId, recurringDate, templateBooking, bookingNo, newId) {
  const base = { ...templateBooking };
  base.id = newId;
  base.bookingNo = bookingNo;
  base.pickupDate = recurringDate;
  // FIX B: ALWAYS set deliveryDate = recurringDate (do not keep template's deliveryDate)
  base.deliveryDate = recurringDate;
  base.recurringRuleId = ruleId;
  base.recurringDate = recurringDate;
  base.recurringKey = `${ruleId}:${recurringDate}`;
  return base;
}

/**
 * Idempotent: create missing bookings only. Uses top-level recurringKey and $setOnInsert.
 */
async function generateRecurringBookings(ruleId) {
  const rule = await recurringRulesRepo.getById(ruleId);
  if (!rule) throw new Error('Recurring rule not found');

  const { templateBooking, startDate, repeatWeeks, weeksAhead } = rule;
  const dates = getRecurrenceDates(startDate, repeatWeeks, weeksAhead);
  if (dates.length === 0) return { created: 0 };

  const db = await getDatabase();
  const now = new Date();
  const bookingsColl = db.collection('bookings');

  const ops = dates.map(recurringDate => {
    const recurringKey = `${ruleId}:${recurringDate}`;
    const newId = `bk_${crypto.randomUUID()}`;
    const bookingNo = `${recurringDate.replace(/-/g, '')}-R`;
    const payload = buildGeneratedPayload(ruleId, recurringDate, templateBooking, bookingNo, newId);

    const doc = {
      _id: newId,
      payload,
      status: payload.status || 'Bokad',
      bookingDate: recurringDate,
      recurringKey,
      recurringRuleId: ruleId,
      recurringDate,
      createdAt: now,
      updatedAt: now,
    };

    return {
      updateOne: {
        filter: { recurringKey },
        update: { $setOnInsert: doc },
        upsert: true,
      },
    };
  });

  const result = await bookingsColl.bulkWrite(ops, { ordered: false });
  return { created: result.upsertedCount ?? 0 };
}

module.exports = { generateRecurringBookings, getRecurrenceDates };
