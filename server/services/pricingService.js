const pricingRepo = require('../repos/pricingRepo');

async function listPricing() {
  return pricingRepo.getCustomerPricing();
}

module.exports = {
  listPricing,
};
