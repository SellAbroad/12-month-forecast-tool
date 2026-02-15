import { getShippingCostUSD, getEffectiveRateUSDPerKg } from '../data/shippingRates'

interface MarginCalculatorProps {
  aov: string
  cogs: string
  productWeightKg: string
  firstMonthMarketingBudget: string
  onAovChange: (v: string) => void
  onCogsChange: (v: string) => void
  onWeightChange: (v: string) => void
  onFirstMonthMarketingBudgetChange: (v: string) => void
}

export function MarginCalculator({
  aov,
  cogs,
  productWeightKg,
  firstMonthMarketingBudget,
  onAovChange,
  onCogsChange,
  onWeightChange,
  onFirstMonthMarketingBudgetChange,
}: MarginCalculatorProps) {
  const aovNum = parseFloat(aov) || 0
  const cogsNum = parseFloat(cogs) || 0
  const weightNum = parseFloat(productWeightKg) || 0
  const shippingPerOrderUSD = getShippingCostUSD(weightNum)
  const effectiveRate = getEffectiveRateUSDPerKg(weightNum)
  const contributionMargin = Math.max(0, aovNum - cogsNum - shippingPerOrderUSD)
  const marginPercent = aovNum > 0 ? (contributionMargin / aovNum) * 100 : 0

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        Business inputs & margin
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
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
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
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
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
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
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
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
