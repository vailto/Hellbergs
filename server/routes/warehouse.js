const express = require('express');
const warehouseService = require('../services/warehouseService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const data = await warehouseService.listWarehouse();
    res.json(data);
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    res.status(500).json({ error: 'Failed to fetch warehouse' });
  }
});

module.exports = router;
