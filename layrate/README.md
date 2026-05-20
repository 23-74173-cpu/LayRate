# layrate-v2-prototype

LayRate v2 prototype built as a React single-page application for offline poultry egg production monitoring and forecasting.

## Stack

- React (hooks)
- Bootstrap
- Recharts
- lucide-react icons
- Vite

## Run Locally

1. Install dependencies

```bash
npm install
```

2. Start development server

```bash
npm run dev
```

3. Build production bundle

```bash
npm run build
```

## Main Files

- `src/App.jsx` - Single-file app shell, pages, mock data, charts, modals, toasts, and interactions
- `src/main.jsx` - React entrypoint
- `vite.config.js` - Vite config

## Implemented Pages

- Dashboard
- Cage Management
- Egg Logging
- Environment
- Feed & Nutrition
- Analytics
- Forecast
- Reports
- Settings

## Key Behaviors

- Sidebar collapse state persisted in localStorage using `layrate_sidebar_collapsed`
- HDEP grade color coding across cards/tables
- Recharts-based trend, bar, scatter, and forecast visualizations
- Modal flows for Add Cage and Add Feed Batch
- Toast notifications for save/export/delete style actions
