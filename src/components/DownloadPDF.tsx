import { useState, useCallback } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, addMonths, startOfMonth } from 'date-fns'
import type { BusinessInputs } from '../types'
import type { MonthForecast } from '../types'
import { getMerchandisingEvents, getCountryDisplayName } from '../data/merchandisingEvents'
import { LeadCaptureModal } from './LeadCaptureModal'
import { submitForecastLead } from '../services/api'

interface DownloadPDFProps {
  inputs: BusinessInputs
  forecast: MonthForecast[]
  brandName: string
  forecastStartDate: Date
  chartRef: React.RefObject<{ toBase64Image?: () => string } | null>
  selectedEventIds: Set<string>
  isEmbedded?: boolean
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '').trim() || 'Brand'
}

function addPageIfNeeded(doc: jsPDF, y: number, margin: number, needed: number): number {
  const pageH = doc.internal.pageSize.getHeight()
  if (y + needed > pageH - margin) {
    doc.addPage()
    return margin
  }
  return y
}

const DEMO_URL = 'https://calendly.com/salimrennewi/sellabroad-demo'
const LOGO_URL = '/sellabroad-logo.png'

function loadImageAsDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('No canvas context'))
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to load logo'))
    img.src = url
  })
}

export function DownloadPDF({
  inputs,
  forecast,
  brandName,
  forecastStartDate,
  chartRef,
  selectedEventIds,
  isEmbedded = false,
}: DownloadPDFProps) {
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleDownload = async () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const margin = 14
    const pageW = doc.internal.pageSize.getWidth()
    let y = margin

    // ----- Logo at top (centered) -----
    try {
      const logoDataUrl = await loadImageAsDataUrl(LOGO_URL)
      const logoW = 45 * 1.05 * 1.05 * 1.1
      const logoH = 14
      const logoX = (pageW - logoW) / 2
      doc.addImage(logoDataUrl, 'PNG', logoX, y, logoW, logoH)
      y += logoH + 8
    } catch {
      y += 4
    }

    // ----- Title -----
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    const title = brandName.trim()
      ? `SellAbroad 12-Month Forecast For ${brandName.trim()}`
      : 'SellAbroad 12-Month Forecast'
    doc.text(title, margin, y)
    y += 12

    // ----- 1. Business inputs (horizontal like frontend) -----
    y = addPageIfNeeded(doc, y, margin, 35)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('1. Business inputs', margin, y)
    y += 8

    const inputLabels = [
      'Brand',
      'AOV ($)',
      'COGS ($)',
      'Product weight (kg)',
      'Shipping/order ($)',
      'Marketing M1 ($)',
      'Contribution margin/order ($)',
    ]
    const inputValues = [
      brandName.trim() || '—',
      inputs.aov.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      inputs.cogs.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      String(inputs.productWeightKg),
      inputs.shippingPerOrderUSD.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      inputs.firstMonthMarketingBudget.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      (inputs.aov - inputs.cogs - inputs.shippingPerOrderUSD).toLocaleString('en-US', { minimumFractionDigits: 2 }),
    ]
    autoTable(doc, {
      startY: y,
      head: [inputLabels],
      body: [inputValues],
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [248, 250, 252], textColor: [30, 41, 59] },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

    // ----- 2. Global merchandising events (calendar grid, selected only) -----
    const allEvents = getMerchandisingEvents(forecastStartDate)
    const selectedEvents = allEvents.filter((e) => selectedEventIds.has(e.id))
    const byMonth: Record<string, { name: string; lift: number }[]> = {}
    const eventLabel = (e: (typeof allEvents)[0]) =>
      e.countries?.length
        ? `${e.name} (${e.countries.map(getCountryDisplayName).join(', ')})`
        : e.country
          ? `${e.name} (${getCountryDisplayName(e.country)})`
          : e.name
    selectedEvents.forEach((e) => {
      const monthKey = e.date.slice(0, 7)
      if (!byMonth[monthKey]) byMonth[monthKey] = []
      byMonth[monthKey].push({ name: eventLabel(e), lift: e.conversionLiftPercent })
    })

    const monthKeys = Array.from({ length: 12 }, (_, i) =>
      format(addMonths(startOfMonth(forecastStartDate), i), 'yyyy-MM')
    )

    y = addPageIfNeeded(doc, y, margin, 75)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('2. Global merchandising events', margin, y)
    y += 8

    // Calendar grid: 4 columns x 3 rows (12 months)
    const colW = (pageW - margin * 2) / 4
    const rowH = 28
    const startX = margin
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const i = row * 4 + col
        const monthKey = monthKeys[i]
        const x = startX + col * colW
        const cellY = y + row * rowH
        doc.setDrawColor(200, 200, 200)
        doc.rect(x, cellY, colW, rowH)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        const monthLabel = format(new Date(monthKey + '-01'), 'MMM yyyy')
        doc.text(monthLabel, x + 2, cellY + 5)
        doc.setFont('helvetica', 'normal')
        const events = byMonth[monthKey] || []
        let lineY = cellY + 10
        if (events.length === 0) {
          doc.setTextColor(150, 150, 150)
          doc.text('No events', x + 2, lineY)
          doc.setTextColor(0, 0, 0)
        } else {
          events.slice(0, 4).forEach((e) => {
            doc.text(`${e.name} (+${e.lift}%)`, x + 2, lineY)
            lineY += 4
          })
          if (events.length > 4) doc.text(`+${events.length - 4} more`, x + 2, lineY)
        }
      }
    }
    y += 3 * rowH + 8

    // ----- 3. 12-month sales forecast & P&L chart -----
    y = addPageIfNeeded(doc, y, margin, 80)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('3. 12-month sales forecast & P&L (chart)', margin, y)
    y += 8

    // Capture chart from DOM canvas (more reliable than ref when export runs)
    const chartEl = document.getElementById('forecast-chart-pdf-export')
    const canvas = chartEl?.querySelector('canvas')
    const chartImg =
      (canvas instanceof HTMLCanvasElement ? canvas.toDataURL('image/png') : null) ??
      chartRef.current?.toBase64Image?.()
    if (chartImg) {
      const imgW = pageW - margin * 2
      const imgH = 55
      y = addPageIfNeeded(doc, y, margin, imgH + 5)
      doc.addImage(chartImg, 'PNG', margin, y, imgW, imgH)
      y += imgH + 8
    } else {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Chart not available in this export. View the app for the interactive chart.', margin, y)
      y += 8
    }

    // ----- 4. P&L table -----
    y = addPageIfNeeded(doc, y, margin, 30)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('4. P&L table (12 months)', margin, y)
    y += 8

    const headers = ['Month', 'Revenue', 'COGS', 'Shipping', 'Marketing', 'Profit', 'Event']
    const rows = forecast.map((f) => [
      f.monthLabel,
      `$${f.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `$${f.cogsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `$${f.shippingTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `$${f.marketingTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `$${f.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      f.eventName ? `+${f.conversionLiftPercent}% ${f.eventName}` : '—',
    ])
    const totalRevenue = forecast.reduce((s, f) => s + f.revenue, 0)
    const totalCogs = forecast.reduce((s, f) => s + f.cogsTotal, 0)
    const totalShipping = forecast.reduce((s, f) => s + f.shippingTotal, 0)
    const totalMarketing = forecast.reduce((s, f) => s + f.marketingTotal, 0)
    const totalProfit = forecast.reduce((s, f) => s + f.profit, 0)
    const footerRow = [
      'Total (12 months)',
      `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `$${totalCogs.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `$${totalShipping.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `$${totalMarketing.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `$${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      '',
    ]

    autoTable(doc, {
      startY: y,
      head: [headers],
      body: rows,
      foot: [footerRow],
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [248, 250, 252], textColor: [30, 41, 59] },
      footStyles: { fillColor: [241, 245, 249], fontStyle: 'bold' },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12

    // ----- CTA: Book a demo (right after P&L section, clickable link) -----
    y = addPageIfNeeded(doc, y, margin, 35)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Book your SellAbroad demo', margin, y)
    y += 10
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(59, 130, 246)
    doc.textWithLink(DEMO_URL, margin, y, { url: DEMO_URL })
    doc.setTextColor(0, 0, 0)
    y += 10
    doc.setFontSize(10)
    doc.text('Schedule a call with our team to see how SellAbroad can help you scale globally.', margin, y)

    const safeName = sanitizeFilename(brandName)
    doc.save(`SellAbroad 12 Month Forecast For ${safeName}.pdf`)
  }

  const handleButtonClick = () => {
    if (isEmbedded || sessionStorage.getItem('forecast_lead_captured')) {
      handleDownload()
      return
    }
    setShowModal(true)
  }

  const handleLeadSubmit = useCallback(async (formData: { name: string; email: string; phone: string; company: string }) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const totalRevenue = forecast.reduce((s, f) => s + f.revenue, 0)
      const totalProfit = forecast.reduce((s, f) => s + f.profit, 0)
      const forecastSummary = `12-mo revenue: $${totalRevenue.toLocaleString()}, profit: $${totalProfit.toLocaleString()}, AOV: $${inputs.aov}`

      await submitForecastLead({
        ...formData,
        brand_name: brandName || undefined,
        forecast_summary: forecastSummary,
      })
      sessionStorage.setItem('forecast_lead_captured', 'true')
      setShowModal(false)
      handleDownload()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [brandName, forecast, inputs.aov])

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-slate-800">Export report</h2>
        <p className="mb-4 text-sm text-slate-500">
          Download a full PDF: business inputs, merchandising events, 12-month chart, and P&L table.
        </p>
        <button
          type="button"
          onClick={handleButtonClick}
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Download PDF
        </button>
      </section>

      <LeadCaptureModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleLeadSubmit}
        isSubmitting={isSubmitting}
        error={submitError}
      />
    </>
  )
}
