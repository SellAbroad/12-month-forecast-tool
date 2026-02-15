export type Region = 'GCC' | 'EU' | 'US' | 'Canada'

export interface MerchandisingEvent {
  id: string
  name: string
  date: string // YYYY-MM-DD
  region: Region
  conversionLiftPercent: number
  description?: string
  /** Single country (event applies when region contains this country) */
  country?: string
  /** Multiple countries (event applies when region contains any of these, e.g. Boxing Day = UK, US, Canada) */
  countries?: string[]
}

export interface BusinessInputs {
  aov: number
  cogs: number
  productWeightKg: number
  firstMonthMarketingBudget: number
  shippingPerOrderUSD: number // computed from weight with tiered rates (900 INR/kg → USD)
}

export interface MonthForecast {
  month: string
  monthLabel: string
  orders: number
  revenue: number
  cogsTotal: number
  shippingTotal: number
  marketingTotal: number
  profit: number
  conversionLiftPercent: number
  eventName?: string
}

export interface PLRow {
  month: string
  revenue: number
  cogs: number
  shipping: number
  marketing: number
  profit: number
  isEventMonth: boolean
}
