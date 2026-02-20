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

const LEADS_API_URL = import.meta.env.VITE_LEADS_API_URL ?? ''

function App() {
  const [isEmbedded, setIsEmbedded] = useState(false)
  const [embedStep, setEmbedStep] = useState(1)

  const [brandName, setBrandName] = useState('')
  const [aov, setAov] = useState('')
  const [cogs, setCogs] = useState('')
  const [productWeightKg, setProductWeightKg] = useState('')
  const [firstMonthMarketingBudget, setFirstMonthMarketingBudget] = useState('')
  const [forecastStartDate, setForecastStartDate] = useState(() => startOfMonth(new Date()))
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const reportRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ChartJS<'line'> | null>(null)

  // Lead capture (normal page only) – gates PDF download
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [leadError, setLeadError] = useState<string | null>(null)

  useEffect(() => {
    setIsEmbedded(window.self !== window.top)
  }, [])

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

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLeadError(null)
    if (!leadName.trim() || !leadEmail.trim() || !leadPhone.trim() || !brandName.trim()) {
      setLeadError('Please fill in Name, Email, Phone, and Brand name.')
      return
    }
    if (!LEADS_API_URL) {
      setLeadError('Lead API is not configured (VITE_LEADS_API_URL). Engineer: add backend and set env.')
      return
    }
    setLeadSubmitting(true)
    try {
      const res = await fetch(LEADS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName.trim(),
          email: leadEmail.trim(),
          phone: leadPhone.trim(),
          brandName: brandName.trim(),
        }),
      })
      if (!res.ok) throw new Error(res.statusText || 'Request failed')
      setLeadSubmitted(true)
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLeadSubmitting(false)
    }
  }

  // —— Normal page (not in iframe): same layout + lead gate before download ——
  if (!isEmbedded) {
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

          {/* Lead capture: required before download on normal page */}
          {!leadSubmitted ? (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-slate-800">Get your PDF report</h2>
              <p className="mb-4 text-sm text-slate-500">
                Enter your details to download the forecast PDF. Our sales team may reach out.
              </p>
              <form onSubmit={handleLeadSubmit} className="max-w-md space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Name</label>
                  <input
                    type="text"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Phone</label>
                  <input
                    type="tel"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Brand name</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Acme Co"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                {leadError && (
                  <p className="text-sm text-red-600">{leadError}</p>
                )}
                <button
                  type="submit"
                  disabled={leadSubmitting}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {leadSubmitting ? 'Submitting…' : 'Submit & unlock PDF download'}
                </button>
              </form>
            </section>
          ) : null}

          {leadSubmitted && (
            <DownloadPDF
              inputs={inputs}
              forecast={forecast}
              brandName={brandName}
              forecastStartDate={forecastStartDate}
              chartRef={chartRef}
              selectedEventIds={selectedEventIds}
            />
          )}
        </main>
      </div>
    )
  }

  // —— Embedded (iframe): step-by-step wizard, no lead form ——
  const totalSteps = 5
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 text-sm font-medium text-slate-500">
          Step {embedStep} of {totalSteps}
        </p>

        {embedStep === 1 && (
          <>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Business inputs</h2>
            <label className="mb-2 block text-sm font-medium text-slate-600">Brand name</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Acme Co"
              className="mb-6 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
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
          </>
        )}

        {embedStep === 2 && (
          <>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Merchandising calendar</h2>
            <MerchandisingCalendar
              forecastStartDate={forecastStartDate}
              selectedEventIds={selectedEventIds}
              onToggleEvent={handleToggleEvent}
            />
          </>
        )}

        {embedStep === 3 && (
          <>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">12‑Month forecast chart</h2>
            <label className="mb-2 block text-sm font-medium text-slate-600">Forecast start</label>
            <input
              type="month"
              value={format(forecastStartDate, 'yyyy-MM')}
              min={format(minStart, 'yyyy-MM')}
              max={format(maxStart, 'yyyy-MM')}
              onChange={(e) => {
                const d = new Date(e.target.value + '-01')
                if (!isNaN(d.getTime())) setForecastStartDate(startOfMonth(d))
              }}
              className="mb-4 rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <ForecastChart forecast={forecast} chartRef={chartRef} />
          </>
        )}

        {embedStep === 4 && (
          <>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">P&L table</h2>
            <PLTable forecast={forecast} />
          </>
        )}

        {embedStep === 5 && (
          <>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Download your report</h2>
            <p className="mb-4 text-sm text-slate-500">
              Download the full PDF with inputs, events, chart, and P&L table.
            </p>
            <DownloadPDF
              inputs={inputs}
              forecast={forecast}
              brandName={brandName}
              forecastStartDate={forecastStartDate}
              chartRef={chartRef}
              selectedEventIds={selectedEventIds}
            />
          </>
        )}

        <div className="mt-8 flex items-center gap-3">
          {embedStep > 1 && (
            <button
              type="button"
              onClick={() => setEmbedStep((s) => s - 1)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Back
            </button>
          )}
          {embedStep < totalSteps && (
            <button
              type="button"
              onClick={() => setEmbedStep((s) => s + 1)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
