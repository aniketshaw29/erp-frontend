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

// Purchase
const PurchaseOrderListPage = React.lazy(() => import('./modules/purchase/PurchaseOrderListPage'))
const PurchaseOrderFormPage = React.lazy(() => import('./modules/purchase/PurchaseOrderFormPage'))
const GrnFormPage = React.lazy(() => import('./modules/purchase/GrnFormPage'))
const PurchaseBillListPage = React.lazy(() => import('./modules/purchase/PurchaseBillListPage'))
const PurchaseBillFormPage = React.lazy(() => import('./modules/purchase/PurchaseBillFormPage'))

// Sales
const InvoiceListPage = React.lazy(() => import('./modules/sales/InvoiceListPage'))
const InvoiceFormPage = React.lazy(() => import('./modules/sales/InvoiceFormPage'))
const PaymentPage = React.lazy(() => import('./modules/sales/PaymentPage'))
const OutstandingPage = React.lazy(() => import('./modules/sales/OutstandingPage'))
const CreditNoteFormPage = React.lazy(() => import('./modules/sales/CreditNoteFormPage'))

// Stub pages (not yet implemented as full pages)
const GrnListPage = React.lazy(() => import('./modules/stubs/StubPage'))
const EInvoicePage = React.lazy(() => import('./modules/stubs/StubPage'))
const Gstr1Page = React.lazy(() => import('./modules/stubs/StubPage'))
const LedgerPage = React.lazy(() => import('./modules/stubs/StubPage'))
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

            {/* Purchase */}
            <Route path="purchase/orders" element={<PurchaseOrderListPage />} />
            <Route path="purchase/orders/new" element={<PurchaseOrderFormPage />} />
            <Route path="purchase/orders/:id/edit" element={<PurchaseOrderFormPage />} />
            <Route path="purchase/grn" element={<GrnListPage />} />
            <Route path="purchase/grn/new" element={<GrnFormPage />} />
            <Route path="purchase/bills" element={<PurchaseBillListPage />} />
            <Route path="purchase/bills/new" element={<PurchaseBillFormPage />} />

            {/* Sales */}
            <Route path="sales/invoices" element={<InvoiceListPage />} />
            <Route path="sales/invoices/new" element={<InvoiceFormPage />} />
            <Route path="sales/payments" element={<PaymentPage />} />
            <Route path="sales/outstanding" element={<OutstandingPage />} />
            <Route path="sales/credit-notes/new" element={<CreditNoteFormPage />} />

            {/* GST */}
            <Route path="gst/einvoice" element={<EInvoicePage />} />
            <Route path="gst/gstr1" element={<Gstr1Page />} />

            {/* Accounts */}
            <Route path="accounts/ledger" element={<LedgerPage />} />

            {/* Reports */}
            <Route path="reports/*" element={<ReportsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
