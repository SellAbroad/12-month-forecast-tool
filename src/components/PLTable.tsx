import type { MonthForecast } from '../types'

interface PLTableProps {
  forecast: MonthForecast[]
}

export function PLTable({ forecast }: PLTableProps) {
  const totalRevenue = forecast.reduce((s, f) => s + f.revenue, 0)
  const totalCogs = forecast.reduce((s, f) => s + f.cogsTotal, 0)
  const totalShipping = forecast.reduce((s, f) => s + f.shippingTotal, 0)
  const totalMarketing = forecast.reduce((s, f) => s + f.marketingTotal, 0)
  const totalProfit = forecast.reduce((s, f) => s + f.profit, 0)
  const cogsPercent = totalRevenue > 0 ? (totalCogs / totalRevenue) * 100 : 0

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 font-semibold text-slate-700">Month</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Revenue</th>
            <th className="px-4 py-3 font-semibold text-slate-700">COGS</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Shipping</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Marketing</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Profit</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Event</th>
          </tr>
        </thead>
        <tbody>
          {forecast.map((row) => (
            <tr
              key={row.month}
              className={`border-b border-slate-100 ${
                row.conversionLiftPercent > 0 ? 'bg-amber-50/60' : ''
              }`}
            >
              <td className="px-4 py-2 font-medium text-slate-800">{row.monthLabel}</td>
              <td className="px-4 py-2 text-slate-700">
                ${row.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-2 text-slate-700">
                ${row.cogsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-2 text-slate-700">
                ${row.shippingTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-2 text-slate-700">
                ${row.marketingTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-2 font-medium text-slate-800">
                ${row.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-2">
                {row.eventName ? (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    +{row.conversionLiftPercent}% {row.eventName}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200 bg-slate-100 font-semibold">
            <td className="px-4 py-3 text-slate-800">Total (12 months)</td>
            <td className="px-4 py-3">
              ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
            <td className="px-4 py-3">
              ${totalCogs.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({cogsPercent.toFixed(1)}%)
            </td>
            <td className="px-4 py-3">
              ${totalShipping.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
            <td className="px-4 py-3">
              ${totalMarketing.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
            <td className="px-4 py-3 text-green-700">
              ${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
            <td className="px-4 py-3" />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
