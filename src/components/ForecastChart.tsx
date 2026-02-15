import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { MonthForecast } from '../types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ForecastChartProps {
  forecast: MonthForecast[]
  chartRef?: React.RefObject<ChartJS<'line'> | null>
}

export function ForecastChart({ forecast, chartRef }: ForecastChartProps) {
  const labels = forecast.map((f) => f.monthLabel)
  const revenue = forecast.map((f) => f.revenue)
  const profit = forecast.map((f) => f.profit)
  const costs = forecast.map((f) => f.cogsTotal + f.shippingTotal)
  const marketing = forecast.map((f) => f.marketingTotal)

  const data = {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data: revenue,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Profit',
        data: profit,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Costs (COGS + Shipping)',
        data: costs,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Marketing',
        data: marketing,
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (ctx: { raw?: unknown }) =>
            ` $${Number(ctx.raw ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) =>
            '$' + Number(value).toLocaleString('en-US'),
        },
      },
    },
  }

  return (
    <div id="forecast-chart-pdf-export" className="h-[320px] w-full">
      <Line ref={chartRef} data={data} options={options} />
    </div>
  )
}
