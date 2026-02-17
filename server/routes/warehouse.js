const express = require('express');
const warehouseService = require('../services/warehouseService');

const router = express.Router();

function requireAdminToken(req, res, next) {
  const token = process.env.ADMIN_TOKEN;
  const auth = req.headers.authorization;
  if (!token || !auth || auth !== `Bearer ${token}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.get('/', async (req, res) => {
  try {
    const data = await warehouseService.listWarehouse();
    res.json(data);
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    res.status(500).json({ error: 'Failed to fetch warehouse' });
  }
});

router.get('/items/:id/storage-invoice-line', requireAdminToken, async (req, res) => {
  const itemId = req.params.id;
  const toDate =
    req.query.toDate && /^\d{4}-\d{2}-\d{2}$/.test(req.query.toDate)
      ? req.query.toDate
      : new Date().toISOString().slice(0, 10);
  try {
    const line = await warehouseService.buildStorageInvoiceLine(itemId, toDate);
    if (!line) return res.status(404).json({ error: 'Warehouse item not found' });
    res.json(line);
  } catch (error) {
    console.error('Error building storage invoice line:', error);
    res.status(500).json({ error: 'Failed to build storage invoice line' });
  }
});

module.exports = router;
