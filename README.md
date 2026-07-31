# ERP Platform — Frontend

> React 18 single-page application for the ERP Platform — covers parties, catalog, inventory, purchase, sales, GST compliance, and accounts.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5-0170FE?logo=antdesign&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Overview

This is a React SPA that serves as the frontend for the ERP platform, communicating with the [erp-backend](https://github.com/aniketshaw29/erp-backend) REST API. It covers the full breadth of ERP workflows — party master, product catalog, inventory tracking, procurement, sales invoicing, GST compliance, and financial accounts — all within a unified Ant Design shell with role-based route protection.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI rendering, Suspense-based lazy loading |
| TypeScript | 5 | Static typing across the entire codebase |
| Vite | 5 | Dev server, HMR, production bundler |
| Ant Design | 5 | Component library and design system |
| TanStack Query | 5 | Server-state fetching, caching, and invalidation |
| Zustand | 4 | Client-side global state (auth, UI preferences) |
| React Router | v6 | Client-side routing with nested layouts |
| React Hook Form + Zod | 7 + 3 | Form state management and schema validation |
| Recharts | 2 | Dashboard charts and data visualizations |
| Axios | 1 | HTTP client with interceptors for auth headers |

---

## Features

- **Dashboard with KPIs** — summary cards and charts showing revenue, purchase costs, and inventory health at a glance
- **Party management** — unified vendor and customer master with search, create, edit, and type filtering
- **Product catalog** — item master with unit-of-measure, HSN/SAC codes, and GST rate configuration
- **Inventory tracking** — current stock levels with batch numbers and expiry date support; low-stock alert page
- **Purchase flow** — purchase order list with status tracking; GRN and bills pages (in development)
- **Sales and invoicing** — invoice list with status badges; full invoice creation form with line-item entry and automatic GST calculation (CGST/SGST/IGST)
- **GST compliance pages** — e-Invoice generation and GSTR-1 summary pages (in development)
- **Accounts and reports** — ledger, outstanding balances, and general reports pages (in development)
- **Authentication** — JWT-based login/register with protected routes and persistent session via Zustand

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- [erp-backend](https://github.com/aniketshaw29/erp-backend) running on port `8080`

### Installation

```bash
git clone https://github.com/aniketshaw29/erp-frontend
cd erp-frontend
npm install
cp .env.example .env          # set VITE_API_BASE_URL
npm run dev                   # starts on :5173
```

> **Note:** The Vite dev server proxies all `/api/*` requests to `http://localhost:8080` (configured in `vite.config.ts`). The backend must be running before making any API calls from the app.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Base URL of the erp-backend API server |

Copy `.env.example` to `.env` and adjust the value for your environment. Vite exposes only variables prefixed with `VITE_` to the browser bundle.

---

## Project Structure

```
src/
├── api/                  # Axios client and per-module API functions
│   ├── client.ts         # Axios instance with base URL and auth interceptor
│   └── modules/          # auth, catalog, inventory, party, purchase, sales
├── auth/                 # LoginPage, RegisterPage, ProtectedRoute
├── components/           # Shared UI: ErpTable, PageHeader, StatusBadge, AmountDisplay
├── hooks/                # useAuth, usePagination, useTenant
├── layout/               # AppLayout, Sidebar, Topbar
├── modules/              # Feature modules (one directory per domain)
│   ├── dashboard/
│   ├── party/
│   ├── catalog/
│   ├── inventory/
│   ├── purchase/
│   ├── sales/
│   └── stubs/            # Placeholder pages for in-development routes
├── store/                # Zustand stores: authStore, uiStore
├── types/                # Shared TypeScript interfaces per domain
├── App.tsx               # Route definitions
└── main.tsx              # App entry point, QueryClient, BrowserRouter
```

---

## Module Pages

| Module | Page | Route | Status |
|---|---|---|---|
| Auth | Login | `/login` | Done |
| Auth | Register | `/register` | Done |
| Dashboard | Overview & KPIs | `/` | Done |
| Parties | Party list (vendors/customers) | `/parties/*` | Done |
| Catalog | Item list | `/catalog/items` | Done |
| Inventory | Stock list | `/inventory/stock` | Done |
| Inventory | Stock entry | `/inventory/stock-entry` | Done |
| Inventory | Low-stock alerts | `/inventory/alerts` | Done |
| Purchase | Purchase order list | `/purchase/orders` | Done |
| Purchase | Goods receipt note (GRN) | `/purchase/grn` | In development |
| Purchase | Vendor bills | `/purchase/bills` | In development |
| Sales | Invoice list | `/sales/invoices` | Done |
| Sales | New invoice form | `/sales/invoices/new` | Done |
| Sales | Payments | `/sales/payments` | In development |
| GST | e-Invoice | `/gst/einvoice` | In development |
| GST | GSTR-1 | `/gst/gstr1` | In development |
| Accounts | Ledger | `/accounts/ledger` | In development |
| Accounts | Outstanding balances | `/accounts/outstanding` | In development |
| Reports | General reports | `/reports/*` | In development |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR on `http://localhost:5173` |
| `npm run build` | Type-check with `tsc` then produce an optimised production bundle in `dist/` |
| `npm run preview` | Serve the production `dist/` bundle locally for smoke-testing |
| `npm run lint` | Run ESLint across all `.ts` and `.tsx` files; fails on any warning |
| `npm run test` | Run the Vitest test suite *(not yet configured)* |
| `npm run test:coverage` | Run tests with V8 coverage report *(not yet configured)* |

---

## Related Repos

| Repo | Description |
|---|---|
| [erp-backend](https://github.com/aniketshaw29/erp-backend) | Spring Boot REST API — the backend this frontend connects to |

---

## License

This project is licensed under the [MIT License](LICENSE).
