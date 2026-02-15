import { useState, useRef, useEffect, useCallback } from 'react'
import { startOfMonth, format, addMonths } from 'date-fns'
import { MarginCalculator } from './components/MarginCalculator'
import { MerchandisingCalendar } from './components/MerchandisingCalendar'
import { ForecastChart } from './components/ForecastChart'
import { PLTable } from './components/PLTable'
import { DownloadPDF } from './components/DownloadPDF'
import { useForecast } from './hooks/useForecast'
import type { Chart as ChartJS } from 'chart.js'
import { getShippingCostUSD } from './data/shippingRates'
import { getMerchandisingEvents } from './data/merchandisingEvents'

function App() {
  const [brandName, setBrandName] = useState('')
  const [aov, setAov] = useState('')
  const [cogs, setCogs] = useState('')
  const [productWeightKg, setProductWeightKg] = useState('')
  const [firstMonthMarketingBudget, setFirstMonthMarketingBudget] = useState('')
  const [forecastStartDate, setForecastStartDate] = useState(() => startOfMonth(new Date()))
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const reportRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ChartJS<'line'> | null>(null)

  // When forecast start changes, default to all events selected
  useEffect(() => {
    const events = getMerchandisingEvents(forecastStartDate)
    setSelectedEventIds(new Set(events.map((e) => e.id)))
  }, [forecastStartDate])

  const handleToggleEvent = useCallback((id: string) => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const weightNum = parseFloat(productWeightKg) || 0
  const shippingPerOrderUSD = getShippingCostUSD(weightNum)
  const inputs = {
    aov: parseFloat(aov) || 0,
    cogs: parseFloat(cogs) || 0,
    productWeightKg: weightNum,
    firstMonthMarketingBudget: Math.max(0, parseFloat(firstMonthMarketingBudget) || 0),
    shippingPerOrderUSD,
  }
  const { forecast } = useForecast(inputs, forecastStartDate, selectedEventIds)

  const minStart = startOfMonth(new Date())
  const maxStart = addMonths(minStart, 11)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">
          SellAbroad · 12‑Month Forecast Tool
        </h1>
        <p className="mb-4 text-sm text-slate-500">
          Data-driven sales forecast and P&L for your global expansion
        </p>
        <label className="flex flex-col gap-2 max-w-xs">
          <span className="text-sm font-medium text-slate-600">Brand name</span>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. Acme Co"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-4 pb-12">
        <MarginCalculator
          aov={aov}
          cogs={cogs}
          productWeightKg={productWeightKg}
          firstMonthMarketingBudget={firstMonthMarketingBudget}
          onAovChange={setAov}
          onCogsChange={setCogs}
          onWeightChange={setProductWeightKg}
          onFirstMonthMarketingBudgetChange={setFirstMonthMarketingBudget}
        />

        <MerchandisingCalendar
          forecastStartDate={forecastStartDate}
          selectedEventIds={selectedEventIds}
          onToggleEvent={handleToggleEvent}
        />

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            12‑Month sales forecast & P&L
          </h2>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              Forecast start:
              <input
                type="month"
                value={format(forecastStartDate, 'yyyy-MM')}
                min={format(minStart, 'yyyy-MM')}
                max={format(maxStart, 'yyyy-MM')}
                onChange={(e) => {
                  const d = new Date(e.target.value + '-01')
                  if (!isNaN(d.getTime())) setForecastStartDate(startOfMonth(d))
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>

          <div ref={reportRef} className="space-y-6 bg-white">
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <strong>Inputs:</strong> AOV ${inputs.aov.toLocaleString('en-US', { minimumFractionDigits: 2 })} · COGS ${inputs.cogs.toLocaleString('en-US', { minimumFractionDigits: 2 })} ·{' '}
              {inputs.productWeightKg} kg → ${inputs.shippingPerOrderUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}/order shipping ·{' '}
              Marketing M1 ${inputs.firstMonthMarketingBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })} (orders = budget / CAC%×AOV, CAC 35%→25%) ·{' '}
              Contribution margin ${(inputs.aov - inputs.cogs - inputs.shippingPerOrderUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}/order
            </div>
            <ForecastChart forecast={forecast} chartRef={chartRef} />
            <PLTable forecast={forecast} />
          </div>
        </section>

        <DownloadPDF
          inputs={inputs}
          forecast={forecast}
          brandName={brandName}
          forecastStartDate={forecastStartDate}
          chartRef={chartRef}
          selectedEventIds={selectedEventIds}
        />
      </main>
    </div>
  )
}

export default App
