const pricingRepo = require('../repos/pricingRepo');

async function listPricing() {
  return pricingRepo.getCustomerPricing();
}

async function savePricingRow(data) {
  return pricingRepo.upsertCustomerPricing(data);
}

async function removePricingRow(customerId, validFrom) {
  return pricingRepo.deleteCustomerPricing({ customerId, validFrom });
}

module.exports = {
  listPricing,
  savePricingRow,
  removePricingRow,
};
