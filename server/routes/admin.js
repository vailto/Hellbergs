const express = require('express');
const backupService = require('../services/backupService');
const masterdataService = require('../services/masterdataService');

const router = express.Router();

function requireAdminToken(req, res, next) {
  const token = process.env.ADMIN_TOKEN;
  const auth = req.headers.authorization;
  if (!token || !auth || auth !== `Bearer ${token}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function requireSeedToken(req, res, next) {
  const token = process.env.SEED_TOKEN;
  const auth = req.headers.authorization;
  if (!token || !auth || auth !== `Bearer ${token}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.get('/backup', requireAdminToken, async (req, res) => {
  try {
    const payload = await backupService.exportBackup();
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timePart = now.toISOString().slice(11, 19).replace(/:/g, '');
    const filename = `hellbergs-backup-${datePart}-${timePart}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error('Error exporting backup:', error);
    res.status(500).json({ error: 'Failed to export backup' });
  }
});

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
