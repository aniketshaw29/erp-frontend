# ERP Platform — Frontend

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5-0170FE?logo=antdesign&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## Overview

ERP Platform Frontend is a React 18 single-page application for the ERP platform, communicating with the [erp-backend](https://github.com/aniketshaw29/erp-backend) REST API. It provides a full-breadth ERP experience — party master, product catalog, inventory tracking, procurement, sales invoicing, GST compliance, financial accounts, HR, payroll, and cross-tenant transaction management — all within a unified Ant Design shell with role-based route protection. The app is entirely TypeScript with Zod-validated forms and TanStack Query for server state management.

---

## Features

- **Login / Register with JWT auth** — access token stored in memory, refresh token in httpOnly cookie, protected routes via `ProtectedRoute`
- **Dashboard with live KPIs** — 6 stat cards (revenue, purchases, outstanding, inventory value, overdue, active parties), sales trend chart (Recharts), role-specific widget visibility
- **Party management** — unified vendor/customer registry with GSTIN validation, type filter, credit limit, payment terms, inter-tenant linking badge
- **Product catalog** — item master with item type (stock/consumable/service), tracking type (batch/serial/none), HSN code picker, UOM, MRP, category hierarchy; CSV bulk import wizard
- **Inventory** — current stock-on-hand table with warehouse and batch filters, FEFO batch tracking, stock entries (opening/adjustment/transfer), expiry date highlighting, low-stock alerts
- **Purchase cycle** — purchase order list and form with supplier selector, line items, GST auto-calc; GRN form with batch capture per line; supplier bill with 3-way match validation; payment entry
- **Sales cycle** — invoice list with status badges; full invoice creation form with FEFO batch picker, automatic CGST/SGST/IGST calculation, MRP enforcement; payment receipt with invoice allocation; credit note form
- **GST compliance** — e-invoice management (IRN status, manual generate, QR view), GSTR-1 period selector with section preview and JSON/Excel download, GSTR-3B summary, GSTR-2A reconciliation upload
- **Accounts** — chart of accounts tree (ASSET/LIABILITY/EQUITY/INCOME/EXPENSE), journal entry ledger, AR/AP outstanding with age-wise colour coding, party statement, financial reports (P&L, Balance Sheet, Trial Balance)
- **Inter-tenant transactions** — incoming purchase drafts from linked seller tenants, accept/reject flow with item-code mapping diff view, status tracking
- **Retailer portal** — browse supplier catalog, add to cart, place orders, view own invoices and outstanding balance (simplified portal layout)
- **HR & Payroll** — employee master, department/designation, attendance entry, leave types and requests, payroll run, payslip PDF download
- **Reports** — sales/purchase/inventory reports with date-range filters, charts, and Excel export
- **Real-time notification bell** — polling-based in-app notifications, mark as read, type filters (low stock, expiry, overdue, linked transaction)

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI rendering, Suspense-based lazy loading |
| TypeScript | 5 | Static typing across the entire codebase |
| Vite | 5 | Dev server with HMR, optimised production bundler |
| Ant Design | 5 | Component library and design system |
| TanStack Query | 5 | Server-state fetching, caching, background refetch, and mutation |
| Zustand | 4 | Client-side global state (auth, tenant info, UI preferences) |
| React Router | v6 | Client-side routing with nested layouts and lazy loading |
| React Hook Form + Zod | 7 + 3 | Form state management and schema validation |
| Recharts | 2 | Dashboard KPI charts and data visualisations |
| Axios | 1 | HTTP client with interceptors for JWT injection and 401 refresh |

---

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm 10 or later
- [erp-backend](https://github.com/aniketshaw29/erp-backend) running on port `8080`

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/aniketshaw29/erp-frontend
cd erp-frontend

# 2. Install dependencies
npm install

# 3. Copy and configure environment
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8080

# 4. Start the dev server
npm run dev
# App available at: http://localhost:5173
```

> The Vite dev server proxies all `/api/*` requests to `http://localhost:8080` (configured in `vite.config.ts`). The backend must be running before making API calls from the app.

---

## Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Yes | Base URL of the erp-backend API server |

Copy `.env.example` to `.env`. Vite exposes only variables prefixed with `VITE_` to the browser bundle.

---

## Project Structure

```
src/
├── api/
│   ├── client.ts             # Axios instance with base URL, JWT interceptor, 401 refresh
│   └── modules/              # auth, party, catalog, inventory, purchase, sales,
│                             # gst, accounts, reports, hr, notifications APIs
├── auth/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── ProtectedRoute.tsx    # Checks JWT validity + required permission
├── components/
│   ├── AmountDisplay.tsx     # ₹-formatted amount display (never float)
│   ├── ErpTable.tsx          # Ant Design Table wrapper — pagination, loading, empty state
│   ├── PageHeader.tsx
│   └── StatusBadge.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── usePagination.ts
│   ├── useTenant.ts
│   └── usePermission.ts
├── layout/
│   ├── AppLayout.tsx         # Shell with sidebar + topbar
│   ├── Sidebar.tsx           # Module navigation with permission gating
│   └── Topbar.tsx            # Tenant name, notification bell, user menu
├── modules/
│   ├── dashboard/            # DashboardPage — KPI cards and sales chart
│   ├── party/                # PartyListPage, PartyFormPage, PartyLedgerPage
│   ├── catalog/              # ItemListPage, ItemFormPage, CategoryPage
│   ├── inventory/            # StockListPage, StockEntryPage, BatchListPage, AlertsPage
│   ├── purchase/             # PurchaseOrderListPage, PurchaseOrderFormPage,
│   │                         # GrnFormPage, PurchaseBillPage
│   ├── sales/                # InvoiceListPage, InvoiceFormPage,
│   │                         # CreditNoteFormPage, PaymentPage
│   ├── gst/                  # GstConfigPage, EInvoicePage, Gstr1Page, Gstr3bPage
│   ├── accounts/             # LedgerPage, OutstandingPage, FinancialReportsPage
│   ├── hr/                   # EmployeePage, AttendancePage, LeavePage, PayrollPage
│   └── reports/              # SalesReportPage, InventoryReportPage, PurchaseReportPage
├── store/
│   ├── authStore.ts          # Zustand: user, tenant, access token
│   └── uiStore.ts            # Zustand: sidebar state, theme
├── types/                    # TypeScript interfaces per domain
│   ├── auth.types.ts
│   ├── party.types.ts
│   ├── catalog.types.ts
│   ├── inventory.types.ts
│   ├── sales.types.ts
│   ├── purchase.types.ts
│   └── gst.types.ts
├── App.tsx                   # Route definitions, lazy imports
└── main.tsx                  # Entry point, QueryClient, BrowserRouter
```

---

## Module Pages

| Module | Route | Description |
|---|---|---|
| Auth — Login | `/login` | JWT login with email/password |
| Auth — Register | `/register` | Tenant registration with GSTIN |
| Dashboard | `/` | KPI tiles, sales trend chart |
| Parties | `/parties` | Vendor/customer list with search and type filter |
| Party Form | `/parties/new`, `/parties/:id` | Create/edit party with address |
| Items | `/catalog/items` | Item list with category filter |
| Item Form | `/catalog/items/new`, `/catalog/items/:id` | Create/edit item |
| Categories | `/catalog/categories` | Hierarchical category tree |
| Stock | `/inventory/stock` | Current stock on hand |
| Stock Entry | `/inventory/stock-entry` | Opening stock, adjustment, transfer |
| Batch List | `/inventory/batches` | Batch-level stock with expiry highlights |
| Alerts | `/inventory/alerts` | Low-stock and expiry warnings |
| Purchase Orders | `/purchase/orders` | PO list with status filter |
| PO Form | `/purchase/orders/new`, `/purchase/orders/:id` | Create/edit purchase order |
| GRN Form | `/purchase/grn` | Goods receipt with batch capture |
| Supplier Bills | `/purchase/bills` | Bill list and creation |
| Invoices | `/sales/invoices` | Invoice list with status/date filter |
| New Invoice | `/sales/invoices/new` | Full invoice form with GST auto-calc |
| Payments | `/sales/payments` | Receive payment, allocate to invoices |
| Credit Notes | `/sales/credit-notes` | Credit note issuance |
| GST Config | `/gst/config` | GST registration settings, e-invoice thresholds |
| E-Invoice | `/gst/einvoice` | IRN generation and status |
| GSTR-1 | `/gst/gstr1` | Period preview and export |
| GSTR-3B | `/gst/gstr3b` | Monthly summary return |
| Ledger | `/accounts/ledger` | Account-wise ledger with date filter |
| Outstanding | `/accounts/outstanding` | AR/AP with ageing |
| Financial Reports | `/accounts/reports` | P&L, Balance Sheet, Trial Balance |
| Linked Transactions | `/linked-transactions` | Inter-tenant purchase drafts (accept/reject) |
| Retailer Portal | `/portal/*` | Browse catalog, place orders, view invoices |
| HR — Employees | `/hr/employees` | Employee master |
| HR — Attendance | `/hr/attendance` | Daily attendance entry |
| HR — Leave | `/hr/leave` | Leave types, requests, approvals |
| HR — Payroll | `/hr/payroll` | Payroll runs, payslip PDF |
| Sales Report | `/reports/sales` | Sales analytics with charts |
| Inventory Report | `/reports/inventory` | Stock movement and valuation |
| Purchase Report | `/reports/purchase` | Purchase analytics |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR on `http://localhost:5173` |
| `npm run build` | Type-check with `tsc` then produce an optimised production bundle in `dist/` |
| `npm run preview` | Serve the production `dist/` bundle locally for smoke-testing |
| `npm run lint` | Run ESLint across all `.ts` and `.tsx` files; fails on any warning |
| `npm run type-check` | Run TypeScript compiler without emitting — type errors only |
| `npm run test` | Run the Vitest test suite |
| `npm run test:coverage` | Run tests with V8 coverage report |

---

## Docker

**Build and run with nginx:**

```bash
# Build production image
docker build -t erp-frontend:latest .

# Run container
docker run -d \
  --name erp-frontend \
  -p 80:80 \
  -e VITE_API_BASE_URL=http://your-backend-host:8080 \
  erp-frontend:latest
```

The production Docker image uses a two-stage build: Vite builds the static bundle, then nginx serves it on port 80 with a `try_files` fallback for client-side routing.

---

## Related Repos

| Repo | Description |
|---|---|
| [erp-backend](https://github.com/aniketshaw29/erp-backend) | Spring Boot REST API — the backend this frontend connects to |

---

## License

This project is licensed under the [MIT License](LICENSE).
