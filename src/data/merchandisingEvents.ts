import type { MerchandisingEvent } from '../types'
import { addMonths, format, setDate, startOfMonth } from 'date-fns'
import { EUROPE_TIER1_COUNTRIES } from './europeTier1'

/** Country codes that belong to each region (for "event applies to region") */
export const REGION_COUNTRY_CODES: Record<string, string[]> = {
  GCC: ['GCC'],
  US: ['US'],
  Canada: ['Canada'],
  EU: EUROPE_TIER1_COUNTRIES.map((c) => c.code),
}

function globalEvent(
  baseStart: Date,
  name: string,
  monthOffset: number,
  day: number,
  conversionLiftPercent: number,
  description?: string
): MerchandisingEvent {
  const d = addMonths(startOfMonth(baseStart), monthOffset)
  const date = setDate(d, Math.min(day, 28))
  return {
    id: `global-${name}-${format(date, 'yyyy-MM-dd')}`,
    name,
    date: format(date, 'yyyy-MM-dd'),
    region: 'EU', // not used for filtering when country is absent
    conversionLiftPercent,
    description,
  }
}

function countryEvent(
  baseStart: Date,
  name: string,
  monthOffset: number,
  day: number,
  country: string,
  conversionLiftPercent: number,
  description?: string
): MerchandisingEvent {
  const d = addMonths(startOfMonth(baseStart), monthOffset)
  const date = setDate(d, Math.min(day, 28))
  return {
    id: `country-${country}-${name}-${format(date, 'yyyy-MM-dd')}`,
    name,
    date: format(date, 'yyyy-MM-dd'),
    region: country === 'GCC' ? 'GCC' : country === 'US' ? 'US' : country === 'Canada' ? 'Canada' : 'EU',
    conversionLiftPercent,
    description,
    country,
  }
}

function multiCountryEvent(
  baseStart: Date,
  name: string,
  monthOffset: number,
  day: number,
  countries: string[],
  conversionLiftPercent: number,
  description?: string
): MerchandisingEvent {
  const d = addMonths(startOfMonth(baseStart), monthOffset)
  const date = setDate(d, Math.min(day, 28))
  return {
    id: `multi-${name}-${format(date, 'yyyy-MM-dd')}`,
    name,
    date: format(date, 'yyyy-MM-dd'),
    region: 'EU',
    conversionLiftPercent,
    description,
    countries,
  }
}

/** One global calendar: each logical event appears once. Global events have no country; country-specific show (Country). */
export function getMerchandisingEvents(forecastStart?: Date): MerchandisingEvent[] {
  const baseStart = forecastStart ? startOfMonth(forecastStart) : startOfMonth(new Date())
  const events: MerchandisingEvent[] = []
  for (let m = 0; m < 12; m++) {
    const d = addMonths(baseStart, m)
    const month = d.getMonth()
    const year = d.getFullYear()

    // January – New Year Sale (global), Boxing Day UK
    if (month === 0) {
      events.push(globalEvent(baseStart, 'New Year Sale', m, 1, 7, 'Post-holiday clearance'))
      events.push(countryEvent(baseStart, 'Boxing Day', m, 26, 'UK', 12, 'UK holiday sales'))
    }

    // February – Valentine's Day (global)
    if (month === 1) {
      events.push(globalEvent(baseStart, "Valentine's Day", m, 14, 5, 'Gift shopping'))
    }

    // March – Easter prep / Spring sale (global)
    if (month === 2) {
      events.push(globalEvent(baseStart, 'Easter prep / Spring sale', m, 15, 6, 'Spring promotions'))
    }

    // April – Easter (global), Ramadan/Eid (GCC)
    if (month === 3) {
      events.push(globalEvent(baseStart, 'Easter', m, 20, 8, 'Holiday shopping'))
      events.push(countryEvent(baseStart, 'Ramadan / Eid', m, 15, 'GCC', 18, 'High gift-giving period'))
    }

    // May – Mother's Day (global), May Day / Labour Day (EU-wide, global)
    if (month === 4) {
      events.push(globalEvent(baseStart, "Mother's Day", m, 10, 5, 'Gift demand'))
      events.push(globalEvent(baseStart, 'May Day / Labour Day', m, 1, 3, 'EU-wide public holiday'))
    }

    // June – Summer Sales start (worldwide), Father's Day (global)
    if (month === 5) {
      events.push(globalEvent(baseStart, 'Summer Sales start', m, 21, 8, 'Worldwide mid-year sales'))
      events.push(globalEvent(baseStart, "Father's Day", m, 21, 4, 'Gift demand'))
    }

    // July – Summer Sale (global), Bastille Day (FR)
    if (month === 6) {
      events.push(globalEvent(baseStart, 'Summer Sale', m, 15, 9, 'Mid-year promotion'))
      events.push(countryEvent(baseStart, 'Bastille Day', m, 14, 'FR', 5, 'National holiday'))
    }

    // August – Back to School (global), Assumption (IT, ES)
    if (month === 7) {
      events.push(globalEvent(baseStart, 'Back to School', m, 15, 5, 'Seasonal demand'))
      events.push(countryEvent(baseStart, 'Assumption Day', m, 15, 'IT', 3, 'Public holiday'))
      events.push(countryEvent(baseStart, 'Assumption Day', m, 15, 'ES', 3, 'Public holiday'))
    }

    // September – Back to School Sept (global), Oktoberfest (DE)
    if (month === 8) {
      events.push(globalEvent(baseStart, 'Back to School (Sept)', m, 1, 5, 'Peak BTS'))
      events.push(countryEvent(baseStart, 'Oktoberfest', m, 20, 'DE', 8, 'Germany – major shopping period'))
    }

    // October – German Unity Day (DE), Halloween (global)
    if (month === 9) {
      events.push(countryEvent(baseStart, 'German Unity Day', m, 3, 'DE', 4, 'Public holiday'))
      events.push(globalEvent(baseStart, 'Halloween', m, 31, 6, 'Seasonal shopping'))
    }

    // November – Black Friday, Cyber Monday (global), Singles' Day (global), St Martin's (DE, AT)
    if (month === 10) {
      const nov = new Date(year, 10, 1)
      while (nov.getDay() !== 5) nov.setDate(nov.getDate() + 1)
      nov.setDate(nov.getDate() + 21)
      const bfDay = Math.min(nov.getDate(), 28)
      events.push(globalEvent(baseStart, 'Black Friday', m, bfDay, 12, 'Peak shopping'))
      events.push(globalEvent(baseStart, 'Cyber Monday', m, 28, 10, 'E-commerce peak'))
      events.push(globalEvent(baseStart, "Singles' Day", m, 11, 7, 'Shopping festival'))
      events.push(globalEvent(baseStart, "St Martin's Day", m, 11, 4, 'EU & North America'))
    }

    // December – Christmas (global), St Nicholas (global), Boxing Day (UK & North America only), UAE National Day (GCC)
    if (month === 11) {
      events.push(globalEvent(baseStart, 'Christmas', m, 25, 12, 'Peak holiday'))
      events.push(globalEvent(baseStart, 'St Nicholas Day', m, 6, 4, 'EU & North America'))
      events.push(multiCountryEvent(baseStart, 'Boxing Day', m, 26, ['UK', 'US', 'Canada'], 10, 'UK & North America only'))
      events.push(countryEvent(baseStart, 'UAE National Day', m, 2, 'GCC', 10, 'Local holiday'))
    }
  }
  return events
}

/** Whether this event applies to the given forecast region (global = all; country/countries = when region contains any of those) */
export function eventAppliesToRegion(event: MerchandisingEvent, region: string): boolean {
  if (event.countries?.length) {
    const codes = REGION_COUNTRY_CODES[region]
    return codes ? event.countries.some((c) => codes.includes(c)) : false
  }
  if (event.country) {
    const codes = REGION_COUNTRY_CODES[region]
    return codes ? codes.includes(event.country) : false
  }
  return true
}

export const REGIONS: { value: 'GCC' | 'EU' | 'US' | 'Canada'; label: string }[] = [
  { value: 'GCC', label: 'GCC' },
  { value: 'EU', label: 'New Europe' },
  { value: 'US', label: 'North America (US)' },
  { value: 'Canada', label: 'Canada' },
]

const COUNTRY_DISPLAY_NAMES: Record<string, string> = {
  GCC: 'GCC',
  US: 'United States',
  Canada: 'Canada',
  ...Object.fromEntries(EUROPE_TIER1_COUNTRIES.map((c) => [c.code, c.name])),
}

export function getCountryDisplayName(code: string): string {
  return COUNTRY_DISPLAY_NAMES[code] ?? code
}
