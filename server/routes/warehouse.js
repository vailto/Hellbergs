const express = require('express');
const warehouseService = require('../services/warehouseService');
const { requireAdminToken } = require('../middleware/auth');

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

router.post('/items', requireAdminToken, async (req, res) => {
  const body = req.body || {};
  if (!body.customerId) {
    return res.status(400).json({ error: 'customerId required' });
  }
  try {
    const item = await warehouseService.createWarehouseItem({
      customerId: body.customerId,
      description: body.description,
      initialQuantity: body.initialQuantity,
      dailyStoragePrice: body.dailyStoragePrice,
      arrivedAt: body.arrivedAt,
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating warehouse item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

router.put('/items/:itemId', requireAdminToken, async (req, res) => {
  const { itemId } = req.params;
  const body = req.body || {};
  try {
    const item = await warehouseService.editWarehouseItem(itemId, {
      description: body.description,
      dailyStoragePrice: body.dailyStoragePrice,
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    console.error('Error updating warehouse item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/items/:itemId', requireAdminToken, async (req, res) => {
  const { itemId } = req.params;
  try {
    const result = await warehouseService.removeWarehouseItem(itemId);
    if (!result.deleted) {
      return res.status(400).json({ error: result.error || 'Item not found or has movements' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting warehouse item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

router.post('/items/:itemId/movements', requireAdminToken, async (req, res) => {
  const { itemId } = req.params;
  const body = req.body || {};
  const date = body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null;
  if (!date) return res.status(400).json({ error: 'date (YYYY-MM-DD) required' });
  const quantity = Number(body.quantity);
  if (!(quantity > 0)) return res.status(400).json({ error: 'quantity must be positive' });
  const type = (body.type || '').toUpperCase();
  if (!['IN', 'OUT', 'ADJUST'].includes(type)) {
    return res.status(400).json({ error: 'type must be IN, OUT, or ADJUST' });
  }
  try {
    const result = await warehouseService.recordWarehouseMovement({
      itemId,
      date,
      quantity,
      type,
      note: body.note,
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json({ item: result.item, movement: result.movement });
  } catch (error) {
    console.error('Error recording movement:', error);
    res.status(500).json({ error: 'Failed to record movement' });
  }
});

router.get('/items/:itemId/estimate', requireAdminToken, async (req, res) => {
  const { itemId } = req.params;
  try {
    const estimate = await warehouseService.getWarehouseEstimate(itemId);
    if (!estimate) return res.status(404).json({ error: 'Item not found' });
    res.json(estimate);
  } catch (error) {
    console.error('Error fetching estimate:', error);
    res.status(500).json({ error: 'Failed to get estimate' });
  }
});

module.exports = router;
