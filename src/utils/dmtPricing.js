/**
 * DMT (drivmedelstillägg) affects only distance (mil) pricing, not time-based prices.
 * When hasDmt is true: effectiveMilPrice = milPrice * (1 + dmtPercent/100)
 * When hasDmt is false: effectiveMilPrice = milPrice
 */
export function effectiveMilPrice(milPrice, dmtPercent, hasDmt) {
  const base = Number(milPrice);
  const mil = Number.isNaN(base) ? 0 : base;
  if (!hasDmt) return mil;
  const pct = Number(dmtPercent);
  const percent = Number.isNaN(pct) ? 0 : pct;
  return mil * (1 + percent / 100);
}
