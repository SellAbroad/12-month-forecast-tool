// Shipping: 900 INR per kg (converted to USD). Price per kg drops 15% at 2kg, 3kg, and so on.
const BASE_RATE_INR_PER_KG = 900
const INR_TO_USD = 1 / 83 // convert to USD for display
const TIER_DISCOUNT = 0.85

function getRateForTierINR(tier: number): number {
  return BASE_RATE_INR_PER_KG * Math.pow(TIER_DISCOUNT, Math.max(0, tier))
}

function getShippingCostINR(weightKg: number): number {
  if (weightKg <= 0) return 0
  let total = 0
  let remaining = weightKg
  let tier = 0
  while (remaining > 0 && tier < 10) {
    const kgInTier = Math.min(1, remaining)
    total += kgInTier * getRateForTierINR(tier)
    remaining -= kgInTier
    tier += 1
  }
  if (remaining > 0) total += remaining * getRateForTierINR(tier)
  return Math.round(total * 100) / 100
}

/** Total shipping cost in USD for given weight (kg). Tiered from 900 INR/kg, converted to USD. */
export function getShippingCostUSD(weightKg: number): number {
  return Math.round(getShippingCostINR(weightKg) * INR_TO_USD * 100) / 100
}

/** Effective rate USD per kg for display. */
export function getEffectiveRateUSDPerKg(weightKg: number): number {
  if (weightKg <= 0) return Math.round(BASE_RATE_INR_PER_KG * INR_TO_USD * 100) / 100
  return Math.round((getShippingCostUSD(weightKg) / weightKg) * 100) / 100
}
