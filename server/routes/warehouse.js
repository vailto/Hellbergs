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

function validatePostItemsBody(body) {
  const err = { message: '', statusCode: 400 };
  if (!body || typeof body !== 'object') {
    err.message = 'Body must be an object';
    return err;
  }
  const { customerId, description, quantity, arrivedAt, dailyStoragePrice, bookingId } = body;
  if (customerId == null || String(customerId).trim() === '') {
    err.message = 'customerId is required';
    return err;
  }
  if (description == null || String(description).trim() === '') {
    err.message = 'description is required';
    return err;
  }
  const q = Number(quantity);
  if (quantity == null || Number.isNaN(q) || q <= 0) {
    err.message = 'quantity is required and must be greater than 0';
    return err;
  }
  if (arrivedAt == null || String(arrivedAt).trim() === '') {
    err.message = 'arrivedAt is required';
    return err;
  }
  if (dailyStoragePrice != null && dailyStoragePrice !== '') {
    const d = Number(dailyStoragePrice);
    if (Number.isNaN(d)) {
      err.message = 'dailyStoragePrice must be a number if provided';
      return err;
    }
  }
  return null;
}

router.post('/items', async (req, res) => {
  try {
    const validationError = validatePostItemsBody(req.body);
    if (validationError) {
      return res
        .status(validationError.statusCode)
        .json({ error: validationError.message });
    }
    const result = await warehouseService.createItemWithInMovement(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Error creating warehouse item:', error);
    res.status(500).json({ error: 'Failed to create warehouse item' });
  }
});

function validatePostMovementsBody(body) {
  const err = { message: '', statusCode: 400 };
  if (!body || typeof body !== 'object') {
    err.message = 'Body must be an object';
    return err;
  }
  const { warehouseItemId, type, quantity, date, bookingId } = body;
  if (warehouseItemId == null || String(warehouseItemId).trim() === '') {
    err.message = 'warehouseItemId is required';
    return err;
  }
  const upperType = type != null ? String(type).trim().toUpperCase() : '';
  if (upperType !== 'IN' && upperType !== 'OUT') {
    err.message = 'type is required and must be IN or OUT';
    return err;
  }
  const q = Number(quantity);
  if (quantity == null || Number.isNaN(q) || q <= 0) {
    err.message = 'quantity is required and must be greater than 0';
    return err;
  }
  if (date == null || String(date).trim() === '') {
    err.message = 'date is required';
    return err;
  }
  return null;
}

router.post('/movements', async (req, res) => {
  try {
    const validationError = validatePostMovementsBody(req.body);
    if (validationError) {
      return res
        .status(validationError.statusCode)
        .json({ error: validationError.message });
    }
    const result = await warehouseService.createMovement(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error creating warehouse movement:', error);
    res.status(500).json({ error: 'Failed to create warehouse movement' });
  }
});

module.exports = router;
