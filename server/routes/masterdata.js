const express = require('express');
const masterdataRepo = require('../repos/masterdataRepo');
const masterdataService = require('../services/masterdataService');

const router = express.Router();

// GET /api/masterdata
router.get('/', async (req, res) => {
  try {
    const data = await masterdataRepo.getAllMasterdata();
    res.json(data);
  } catch (error) {
    console.error('Error fetching masterdata:', error);
    res.status(500).json({ error: 'Failed to fetch masterdata' });
  }
});

module.exports = router;
