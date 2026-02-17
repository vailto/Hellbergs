const express = require('express');
const pricingService = require('../services/pricingService');
const { requireAdminToken } = require('../middleware/auth');

const router = express.Router();

const VALID_FROM_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function coerceNum(val) {
  if (val === '' || val == null) return 0;
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

router.get('/', async (req, res) => {
  try {
    const list = await pricingService.listPricing();
    res.json(list);
  } catch (error) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({ error: 'Failed to fetch pricing' });
  }
});

router.put('/customer/:customerId/valid-from/:validFrom', requireAdminToken, async (req, res) => {
  const customerId = req.params.customerId;
  const validFrom = req.params.validFrom;
  if (!customerId || !VALID_FROM_REGEX.test(validFrom)) {
    return res.status(400).json({ error: 'customerId and validFrom (YYYY-MM-DD) required' });
  }
  const body = req.body || {};
  try {
    const row = await pricingService.savePricingRow({
      customerId,
      validFrom,
      dmtPercent: coerceNum(body.dmtPercent),
      milPrice: coerceNum(body.milPrice),
      stopPrice: coerceNum(body.stopPrice),
      waitPrice: coerceNum(body.waitPrice),
      hourPrice: coerceNum(body.hourPrice),
      fixedPrice: coerceNum(body.fixedPrice),
      dailyStoragePrice: coerceNum(body.dailyStoragePrice),
    });
    if (!row) return res.status(400).json({ error: 'Invalid pricing data' });
    res.json(row);
  } catch (error) {
    console.error('Error saving pricing row:', error);
    res.status(500).json({ error: 'Failed to save pricing' });
  }
});

router.delete(
  '/customer/:customerId/valid-from/:validFrom',
  requireAdminToken,
  async (req, res) => {
    const customerId = req.params.customerId;
    const validFrom = req.params.validFrom;
    if (!customerId || !VALID_FROM_REGEX.test(validFrom)) {
      return res.status(400).json({ error: 'customerId and validFrom (YYYY-MM-DD) required' });
    }
    try {
      const deletedCount = await pricingService.removePricingRow(customerId, validFrom);
      if (deletedCount === 0) {
        return res.status(404).json({ error: 'Pricing row not found' });
      }
      res.json({ ok: true });
    } catch (error) {
      console.error('Error deleting pricing row:', error);
      res.status(500).json({ error: 'Failed to delete pricing' });
    }
  }
);

module.exports = router;
