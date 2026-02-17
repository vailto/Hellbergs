const express = require('express');
const masterdataService = require('../services/masterdataService');

const router = express.Router();

function requireSeedToken(req, res, next) {
  const token = process.env.SEED_TOKEN;
  const auth = req.headers.authorization;
  if (!token || !auth || auth !== `Bearer ${token}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// POST /api/admin/seed/masterdata
router.post('/seed/masterdata', requireSeedToken, async (req, res) => {
  try {
    const result = await masterdataService.seedMasterdata();
    res.json({
      customersUpserted: result.customersUpserted,
      vehiclesUpserted: result.vehiclesUpserted,
      driversUpserted: result.driversUpserted,
    });
  } catch (error) {
    console.error('Error seeding masterdata:', error);
    res.status(500).json({ error: 'Failed to seed masterdata' });
  }
});

module.exports = router;
