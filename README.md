# SellAbroad · 12-Month Forecast Tool

Data-driven sales forecast and P&L for global expansion. Use as a consultative sales pitch tool or for merchant planning.

## Deployment

**This app should be deployed to replace the current calculator at [App.sellabroad.com/calculator](https://app.sellabroad.com/calculator).**

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## What’s included

1. **Business inputs & margin** – AOV, COGS, product weight (KG). Shipping cost per KG is derived from pre-set rates by region (GCC, EU, US, Canada). Contribution margin updates in real time.
2. **Global merchandising calendar** – Events for the next 12 months by region (Black Friday, Christmas, Ramadan/Eid, Back to School, etc.) with expected conversion lift. Filter by region; hover/click for details.
3. **12-month forecast & P&L** – Forecast start month picker (default: current month). Sales ramp over the first 3 months then level; events boost conversion by region. Line chart for revenue/profit/costs and a month-by-month P&L table with event months highlighted.
4. **Download PDF** – Exports the forecast section (inputs summary, chart, P&L table) as PDF. For branded docs you can plug in the PandaDoc API.

## Tech

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Chart.js (line chart)
- jsPDF + html2canvas (PDF export)
- date-fns

## Customisation

- **Shipping rates** – Edit `src/data/shippingRates.ts` (per region, per KG).
- **Events** – Edit `src/data/merchandisingEvents.ts` to add/change events and conversion lifts.
- **Forecast ramp** – In `src/hooks/useForecast.ts`, adjust `BASE_ORDERS_MONTH_1`, `RAMP_MULTIPLIER_*`, and `STEADY_MULTIPLIER`.
