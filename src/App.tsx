import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'

const LoginPage = React.lazy(() => import('./auth/LoginPage'))
const RegisterPage = React.lazy(() => import('./auth/RegisterPage'))
const ProtectedRoute = React.lazy(() => import('./auth/ProtectedRoute'))
const AppLayout = React.lazy(() => import('./layout/AppLayout'))
const DashboardPage = React.lazy(() => import('./modules/dashboard/DashboardPage'))
const PartyListPage = React.lazy(() => import('./modules/party/PartyListPage'))
const ItemListPage = React.lazy(() => import('./modules/catalog/ItemListPage'))
const StockListPage = React.lazy(() => import('./modules/inventory/StockListPage'))
const AlertsPage = React.lazy(() => import('./modules/inventory/AlertsPage'))
const StockEntryPage = React.lazy(() => import('./modules/inventory/StockEntryPage'))
const PurchaseOrderListPage = React.lazy(() => import('./modules/purchase/PurchaseOrderListPage'))
const InvoiceListPage = React.lazy(() => import('./modules/sales/InvoiceListPage'))
const InvoiceFormPage = React.lazy(() => import('./modules/sales/InvoiceFormPage'))

// Stub pages
const GrnPage = React.lazy(() => import('./modules/stubs/StubPage'))
const BillsPage = React.lazy(() => import('./modules/stubs/StubPage'))
const PaymentsPage = React.lazy(() => import('./modules/stubs/StubPage'))
const EInvoicePage = React.lazy(() => import('./modules/stubs/StubPage'))
const Gstr1Page = React.lazy(() => import('./modules/stubs/StubPage'))
const LedgerPage = React.lazy(() => import('./modules/stubs/StubPage'))
const OutstandingPage = React.lazy(() => import('./modules/stubs/StubPage'))
const ReportsPage = React.lazy(() => import('./modules/stubs/StubPage'))

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="parties/*" element={<PartyListPage />} />
            <Route path="catalog/items" element={<ItemListPage />} />
            <Route path="inventory/stock" element={<StockListPage />} />
            <Route path="inventory/stock-entry" element={<StockEntryPage />} />
            <Route path="inventory/alerts" element={<AlertsPage />} />
            <Route path="purchase/orders" element={<PurchaseOrderListPage />} />
            <Route path="purchase/grn" element={<GrnPage />} />
            <Route path="purchase/bills" element={<BillsPage />} />
            <Route path="sales/invoices" element={<InvoiceListPage />} />
            <Route path="sales/invoices/new" element={<InvoiceFormPage />} />
            <Route path="sales/payments" element={<PaymentsPage />} />
            <Route path="gst/einvoice" element={<EInvoicePage />} />
            <Route path="gst/gstr1" element={<Gstr1Page />} />
            <Route path="accounts/ledger" element={<LedgerPage />} />
            <Route path="accounts/outstanding" element={<OutstandingPage />} />
            <Route path="reports/*" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
