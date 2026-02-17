const express = require('express');
const pricingService = require('../services/pricingService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pricing = await pricingService.listPricing();
    res.json(pricing);
  } catch (error) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({ error: 'Failed to fetch pricing' });
  }
});

module.exports = router;
