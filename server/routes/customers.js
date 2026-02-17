const express = require('express');
const masterdataRepo = require('../repos/masterdataRepo');
const { requireAdminToken } = require('../middleware/auth');

const router = express.Router();

router.put('/:id/has-dmt', requireAdminToken, async (req, res) => {
  const customerId = req.params.id;
  const hasDmt = req.body?.hasDmt;
  if (typeof hasDmt !== 'boolean') {
    return res.status(400).json({ error: 'Body must include hasDmt (boolean)' });
  }
  try {
    const customer = await masterdataRepo.updateCustomerHasDmt(customerId, hasDmt);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer hasDmt:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

module.exports = router;
