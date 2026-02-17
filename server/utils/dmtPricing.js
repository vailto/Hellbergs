/**
 * DMT (drivmedelstillägg) affects only distance (mil) pricing, not time-based prices.
 * When customer.hasDmt is true: effectiveMilPrice = milPrice * (1 + dmtPercent/100)
 * When customer.hasDmt is false: effectiveMilPrice = milPrice
 * Used later for booking totals; not integrated in this module yet.
 */
function effectiveMilPrice(milPrice, dmtPercent, hasDmt) {
  const base = Number(milPrice) || 0;
  if (!hasDmt) return base;
  const pct = Number(dmtPercent) || 0;
  return base * (1 + pct / 100);
}

module.exports = { effectiveMilPrice };
