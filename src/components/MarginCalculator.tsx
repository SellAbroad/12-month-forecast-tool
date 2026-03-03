import { getShippingCostUSD, getEffectiveRateUSDPerKg } from '../data/shippingRates'

interface MarginCalculatorProps {
  aov: string
  cogs: string
  productWeightKg: string
  firstMonthMarketingBudget: string
  chargeCustomerShipping: boolean
  bundleForFreeShipping: boolean
  bundleMultiplier: string
  onAovChange: (v: string) => void
  onCogsChange: (v: string) => void
  onWeightChange: (v: string) => void
  onFirstMonthMarketingBudgetChange: (v: string) => void
  onChargeCustomerShippingChange: (v: boolean) => void
  onBundleForFreeShippingChange: (v: boolean) => void
  onBundleMultiplierChange: (v: string) => void
}

export function MarginCalculator({
  aov,
  cogs,
  productWeightKg,
  firstMonthMarketingBudget,
  chargeCustomerShipping,
  bundleForFreeShipping,
  bundleMultiplier,
  onAovChange,
  onCogsChange,
  onWeightChange,
  onFirstMonthMarketingBudgetChange,
  onChargeCustomerShippingChange,
  onBundleForFreeShippingChange,
  onBundleMultiplierChange,
}: MarginCalculatorProps) {
  const aovNum = parseFloat(aov) || 0
  const cogsNum = parseFloat(cogs) || 0
  const weightNum = parseFloat(productWeightKg) || 0
  const shippingPerOrderUSD = getShippingCostUSD(weightNum)
  const effectiveRate = getEffectiveRateUSDPerKg(weightNum)

  // Compute effective AOV based on checkbox settings
  let effectiveAov = aovNum
  if (bundleForFreeShipping) {
    const mult = parseFloat(bundleMultiplier) || 1
    if (mult > 0) effectiveAov *= mult
  }
  if (chargeCustomerShipping) {
    effectiveAov += shippingPerOrderUSD
  }

  const contributionMargin = Math.max(0, effectiveAov - cogsNum - shippingPerOrderUSD)
  const marginPercent = effectiveAov > 0 ? (contributionMargin / effectiveAov) * 100 : 0

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        Business inputs & margin
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-start">
        <div className="flex flex-col">
          <label className="mb-1 block h-10 text-sm font-medium text-slate-600">
            AOV (Average Order Value) $
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={aov}
            onChange={(e) => onAovChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. 49.99"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 block h-10 text-sm font-medium text-slate-600">
            COGS (Cost of Goods Sold) $
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={cogs}
            onChange={(e) => onCogsChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. 15"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 block h-10 text-sm font-medium text-slate-600">
            Product weight (KG)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={productWeightKg}
            onChange={(e) => onWeightChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. 0.5"
          />
          <p className="mt-1 text-xs text-slate-500">
            Shipping: tiered from ~$10.84/kg, −15% at 2kg, 3kg…
          </p>
        </div>
        <div className="flex flex-col">
          <label className="mb-1 block h-10 text-sm font-medium text-slate-600">
            Marketing budget (first month) $
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={firstMonthMarketingBudget}
            onChange={(e) => onFirstMonthMarketingBudgetChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. 5000"
          />
          <p className="mt-1 text-xs text-slate-500">
            Orders = budget / (CAC% × AOV). CAC: 35% → 33% → 30% → 28% → 25%
          </p>
        </div>
      </div>

      {/* Shipping & bundling options */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label
          className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
            chargeCustomerShipping
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
          }`}
        >
          <input
            type="checkbox"
            checked={chargeCustomerShipping}
            onChange={(e) => onChargeCustomerShippingChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-slate-700">Charge customer shipping</span>
            <p className="mt-0.5 text-xs text-slate-500">
              Adds ${shippingPerOrderUSD.toFixed(2)} shipping to AOV
            </p>
          </div>
        </label>

        <div
          className={`rounded-lg border p-3 transition ${
            bundleForFreeShipping
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={bundleForFreeShipping}
              onChange={(e) => onBundleForFreeShippingChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">Bundle for Free Shipping threshold</span>
              <p className="mt-0.5 text-xs text-slate-500">
                Multiply AOV by number of items per order
              </p>
            </div>
          </label>
          {bundleForFreeShipping && (
            <div className="mt-2 ml-7 flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="9"
                step="1"
                value={bundleMultiplier}
                onChange={(e) => onBundleMultiplierChange(e.target.value)}
                className="w-16 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="2"
              />
              <span className="text-xs font-medium text-slate-500">× AOV</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-600">Contribution margin (real-time)</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">
          ${contributionMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-base font-normal text-slate-500">/ order</span>
        </p>
        <p className="text-sm text-slate-500">
          {marginPercent.toFixed(1)}% margin · Shipping/order: ${shippingPerOrderUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} (eff. ${effectiveRate}/kg)
        </p>
      </div>
    </section>
  )
}
