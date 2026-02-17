const express = require('express');
const backupService = require('../services/backupService');
const masterdataService = require('../services/masterdataService');
const masterdataRepo = require('../repos/masterdataRepo');
const seedMasterdata = require('../seed/masterdata');

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

router.get('/debug/masterdata-drivers', requireAdminToken, async (req, res) => {
  try {
    const seedDrivers = (seedMasterdata.drivers || []).map(d => ({
      code: d.code ?? '',
      name: d.name ?? '',
    }));
    const dbRaw = await masterdataRepo.getAllDriversRaw();
    const dbDrivers = dbRaw.map(d => ({
      code: d.code ?? '',
      name: d.name ?? '',
      id: d._id,
    }));

    const seedCodes = seedDrivers.map(d => d.code);
    const dbCodes = dbDrivers.map(d => d.code);
    const seedSet = new Set(seedCodes);
    const dbSet = new Set(dbCodes);

    const missingInDb = seedCodes.filter(c => !dbSet.has(c));
    const extraInDb = dbCodes.filter(c => !seedSet.has(c));

    const seedCodeCounts = {};
    seedCodes.forEach(c => {
      seedCodeCounts[c] = (seedCodeCounts[c] || 0) + 1;
    });
    const duplicatesInSeed = [...new Set(seedCodes.filter(c => seedCodeCounts[c] > 1))];

    const dbCodeCounts = {};
    dbCodes.forEach(c => {
      dbCodeCounts[c] = (dbCodeCounts[c] || 0) + 1;
    });
    const duplicatesInDb = [...new Set(dbCodes.filter(c => dbCodeCounts[c] > 1))];

    res.json({
      seedCount: seedDrivers.length,
      dbCount: dbDrivers.length,
      missingInDb,
      extraInDb,
      duplicatesInSeed,
      duplicatesInDb,
      seedDrivers,
      dbDrivers,
    });
  } catch (error) {
    console.error('Error in debug/masterdata-drivers:', error);
    res.status(500).json({ error: 'Failed to compare seed vs DB drivers' });
  }
});

module.exports = router;
