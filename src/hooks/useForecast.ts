import { useMemo } from 'react'
import { addMonths, format, startOfMonth } from 'date-fns'
import type { BusinessInputs, MonthForecast } from '../types'
import { getMerchandisingEvents } from '../data/merchandisingEvents'

// CAC % of AOV by month: 35% → 33% → 30% → 28% → 25%. Orders = spend / (CAC% × AOV).
// Marketing spend grows 5% month over month.
const CAC_PERCENTS = [35, 33, 30, 28, 25, 25, 25, 25, 25, 25, 25, 25]

function getMarketingSpend(monthIndex: number, firstMonthMarketingBudget: number): number {
  return Math.round(firstMonthMarketingBudget * Math.pow(1.05, monthIndex) * 100) / 100
}

function getCacPercent(monthIndex: number): number {
  return (CAC_PERCENTS[Math.min(monthIndex, CAC_PERCENTS.length - 1)] ?? 25) / 100
}

function getConversionLiftForMonth(
  monthStart: Date,
  allEvents: ReturnType<typeof getMerchandisingEvents>,
  selectedEventIds: Set<string>
): { lift: number; eventName?: string } {
  const monthEnd = addMonths(monthStart, 1)
  const events = allEvents.filter(
    (e) =>
      selectedEventIds.has(e.id) &&
      e.date >= format(monthStart, 'yyyy-MM-dd') &&
      e.date < format(monthEnd, 'yyyy-MM-dd')
  )
  if (events.length === 0) return { lift: 0 }
  const max = Math.max(...events.map((e) => e.conversionLiftPercent))
  return { lift: max, eventName: events[0]?.name }
}

export function useForecast(
  inputs: BusinessInputs,
  forecastStartDate: Date,
  selectedEventIds: Set<string>
): { forecast: MonthForecast[]; plRows: { month: string; revenue: number; cogs: number; shipping: number; marketing: number; profit: number; isEventMonth: boolean }[] } {
  return useMemo(() => {
    const { aov, cogs, firstMonthMarketingBudget, shippingPerOrderUSD } = inputs
    const allEvents = getMerchandisingEvents(forecastStartDate)
    const forecast: MonthForecast[] = []
    const plRows: { month: string; revenue: number; cogs: number; shipping: number; marketing: number; profit: number; isEventMonth: boolean }[] = []

    for (let i = 0; i < 12; i++) {
      const monthStart = addMonths(startOfMonth(forecastStartDate), i)
      const monthKey = format(monthStart, 'yyyy-MM')
      const monthLabel = format(monthStart, 'MMM yyyy')
      const marketingTotal = getMarketingSpend(i, firstMonthMarketingBudget)
      const cacPct = getCacPercent(i)
      // Orders = marketing budget / (CAC% × AOV); CAC% is share of AOV per order
      const baseOrders = aov > 0 && cacPct > 0 ? marketingTotal / (cacPct * aov) : 0
      const { lift, eventName } = getConversionLiftForMonth(monthStart, allEvents, selectedEventIds)
      const conversionMultiplier = 1 + lift / 100
      const orders = Math.round(baseOrders * conversionMultiplier)
      const revenue = Math.round(orders * aov * 100) / 100
      const cogsTotal = Math.round(orders * cogs * 100) / 100
      const shippingTotal = Math.round(orders * shippingPerOrderUSD * 100) / 100
      const profit = Math.round((revenue - cogsTotal - shippingTotal - marketingTotal) * 100) / 100

      forecast.push({
        month: monthKey,
        monthLabel,
        orders,
        revenue,
        cogsTotal,
        shippingTotal,
        marketingTotal,
        profit,
        conversionLiftPercent: lift,
        eventName,
      })
      plRows.push({
        month: monthLabel,
        revenue,
        cogs: cogsTotal,
        shipping: shippingTotal,
        marketing: marketingTotal,
        profit,
        isEventMonth: lift > 0,
      })
    }
    return { forecast, plRows }
  }, [
    inputs.aov,
    inputs.cogs,
    inputs.firstMonthMarketingBudget,
    inputs.shippingPerOrderUSD,
    forecastStartDate.getTime(),
    selectedEventIds,
  ])
}
