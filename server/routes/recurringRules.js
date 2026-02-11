const express = require('express');
const recurringRulesRepo = require('../repos/recurringRulesRepo');
const recurringBookingService = require('../services/recurringBookingService');

const router = express.Router();

// FIX C: Separate validation for POST (all required) vs PUT (partial)
function validateRecurringRuleCreate({ templateBooking, startDate, repeatWeeks, weeksAhead }) {
  if (!templateBooking || typeof templateBooking !== 'object') {
    return 'templateBooking (object) is required';
  }
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return 'startDate (YYYY-MM-DD) is required';
  }
  const rw = Number(repeatWeeks);
  if (isNaN(rw) || rw < 1 || rw > 52) {
    return 'repeatWeeks must be between 1 and 52';
  }
  const wa = Number(weeksAhead);
  if (isNaN(wa) || wa < 1 || wa > 104) {
    return 'weeksAhead must be between 1 and 104';
  }
  return null;
}

function validateRecurringRuleUpdate({ templateBooking, startDate, repeatWeeks, weeksAhead }) {
  // At least one field must be provided
  if (
    templateBooking === undefined &&
    startDate === undefined &&
    repeatWeeks === undefined &&
    weeksAhead === undefined
  ) {
    return 'At least one field (templateBooking, startDate, repeatWeeks, weeksAhead) must be provided';
  }

  // Validate only provided fields
  if (templateBooking !== undefined && typeof templateBooking !== 'object') {
    return 'templateBooking must be an object';
  }
  if (startDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return 'startDate must be in YYYY-MM-DD format';
  }
  if (repeatWeeks !== undefined) {
    const rw = Number(repeatWeeks);
    if (isNaN(rw) || rw < 1 || rw > 52) {
      return 'repeatWeeks must be between 1 and 52';
    }
  }
  if (weeksAhead !== undefined) {
    const wa = Number(weeksAhead);
    if (isNaN(wa) || wa < 1 || wa > 104) {
      return 'weeksAhead must be between 1 and 104';
    }
  }
  return null;
}

// POST /api/recurring-rules
router.post('/', async (req, res) => {
  try {
    const { templateBooking, startDate, repeatWeeks = 1, weeksAhead = 12 } = req.body;
    const err = validateRecurringRuleCreate({ templateBooking, startDate, repeatWeeks, weeksAhead });
    if (err) {
      return res.status(400).json({ error: err });
    }
    const rule = await recurringRulesRepo.create({
      templateBooking,
      startDate,
      repeatWeeks,
      weeksAhead,
    });
    await recurringBookingService.generateRecurringBookings(rule._id);
    const updated = await recurringRulesRepo.getById(rule._id);
    res.status(201).json(updated ?? rule);
  } catch (error) {
    console.error('Error creating recurring rule:', error);
    res.status(500).json({ error: 'Failed to create recurring rule' });
  }
});

// PUT /api/recurring-rules/:id - Partial update support
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { templateBooking, startDate, repeatWeeks, weeksAhead } = req.body;

    const err = validateRecurringRuleUpdate({ templateBooking, startDate, repeatWeeks, weeksAhead });
    if (err) {
      return res.status(400).json({ error: err });
    }

    const updateData = {};
    if (templateBooking !== undefined) updateData.templateBooking = templateBooking;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (repeatWeeks !== undefined) updateData.repeatWeeks = repeatWeeks;
    if (weeksAhead !== undefined) updateData.weeksAhead = weeksAhead;

    const updated = await recurringRulesRepo.update(id, updateData);
    if (!updated) {
      return res.status(404).json({ error: 'Recurring rule not found' });
    }

    // After update: run generator using the updated rule
    await recurringBookingService.generateRecurringBookings(id);
    const rule = await recurringRulesRepo.getById(id);
    res.json(rule ?? updated);
  } catch (error) {
    console.error('Error updating recurring rule:', error);
    res.status(500).json({ error: 'Failed to update recurring rule' });
  }
});

module.exports = router;
