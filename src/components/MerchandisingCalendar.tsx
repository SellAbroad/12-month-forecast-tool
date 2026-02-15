import { useMemo } from 'react'
import { format, addMonths, startOfMonth } from 'date-fns'
import { getMerchandisingEvents, getCountryDisplayName } from '../data/merchandisingEvents'

interface MerchandisingCalendarProps {
  forecastStartDate: Date
  selectedEventIds: Set<string>
  onToggleEvent: (id: string) => void
}

export function MerchandisingCalendar({
  forecastStartDate,
  selectedEventIds,
  onToggleEvent,
}: MerchandisingCalendarProps) {
  const allEvents = useMemo(
    () => getMerchandisingEvents(forecastStartDate),
    [forecastStartDate]
  )

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        addMonths(startOfMonth(forecastStartDate), i)
      ),
    [forecastStartDate]
  )

  const eventsByMonth = useMemo(() => {
    const map: Record<string, typeof allEvents> = {}
    months.forEach((m) => {
      const key = format(m, 'yyyy-MM')
      map[key] = allEvents.filter((e) => e.date.startsWith(key))
    })
    return map
  }, [months, allEvents])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        Ecommerce Holiday Calendar 2026
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Check the events to include in your forecast and PDF export.
        Country-specific events show the country in parentheses.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {months.map((monthStart) => {
          const key = format(monthStart, 'yyyy-MM')
          const monthEvents = eventsByMonth[key] || []
          return (
            <div
              key={key}
              className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/50"
            >
              <div className="border-b border-slate-200 px-3 py-2">
                <span className="text-sm font-semibold text-slate-800">
                  {format(monthStart, 'MMMM yyyy')}
                </span>
              </div>
              <div className="p-3">
                <ul className="space-y-1.5">
                  {monthEvents.length === 0 ? (
                    <li className="text-xs text-slate-400">No events</li>
                  ) : (
                    monthEvents.map((ev) => {
                      const checked = selectedEventIds.has(ev.id)
                      return (
                        <li
                          key={ev.id}
                          className="flex items-start gap-2 rounded bg-white px-2 py-1.5 text-xs shadow-sm"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggleEvent(ev.id)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            aria-label={`Include ${ev.name}`}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-slate-800">
                              {ev.name}
                            </span>
                            {(ev.countries?.length || ev.country) && (
                              <span className="ml-1 text-slate-500">
                                ({ev.countries?.length
                                  ? ev.countries.map(getCountryDisplayName).join(', ')
                                  : getCountryDisplayName(ev.country!)}
                                )
                              </span>
                            )}
                            <span className="ml-1 text-green-600">
                              +{ev.conversionLiftPercent}%
                            </span>
                          </div>
                        </li>
                      )
                    })
                  )}
                </ul>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
