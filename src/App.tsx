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
const LinkedTransactionsPage = React.lazy(() => import('./modules/sales/LinkedTransactionsPage'))

// GST
const GstConfigPage = React.lazy(() => import('./modules/gst/GstConfigPage'))
const EInvoicePage = React.lazy(() => import('./modules/gst/EInvoicePage'))
const Gstr1Page = React.lazy(() => import('./modules/gst/Gstr1Page'))
const Gstr3bPage = React.lazy(() => import('./modules/gst/Gstr3bPage'))
const Gstr2aPage = React.lazy(() => import('./modules/gst/Gstr2aPage'))

// Stub pages (not yet implemented as full pages)
const GrnListPage = React.lazy(() => import('./modules/stubs/StubPage'))

// Reports
const SalesReportPage = React.lazy(() => import('./modules/reports/SalesReportPage'))
const PurchaseReportPage = React.lazy(() => import('./modules/reports/PurchaseReportPage'))
const InventoryReportPage = React.lazy(() => import('./modules/reports/InventoryReportPage'))

// Accounts
const ChartOfAccountsPage = React.lazy(() => import('./modules/accounts/ChartOfAccountsPage'))
const JournalEntryPage = React.lazy(() => import('./modules/accounts/JournalEntryPage'))
const LedgerPage = React.lazy(() => import('./modules/accounts/LedgerPage'))
const PartyStatementPage = React.lazy(() => import('./modules/accounts/PartyStatementPage'))
const AccountsOutstandingPage = React.lazy(() => import('./modules/accounts/OutstandingPage'))
const FinancialReportsPage = React.lazy(() => import('./modules/accounts/FinancialReportsPage'))

// HR & Payroll
const EmployeeListPage = React.lazy(() => import('./modules/hr/EmployeeListPage'))
const AttendancePage = React.lazy(() => import('./modules/hr/AttendancePage'))
const LeaveManagementPage = React.lazy(() => import('./modules/hr/LeaveManagementPage'))
const PayrollPage = React.lazy(() => import('./modules/hr/PayrollPage'))
const OrgChartPage = React.lazy(() => import('./modules/hr/OrgChartPage'))

// Portal
const PortalLayout = React.lazy(() => import('./modules/portal/PortalLayout'))
const PortalDashboardPage = React.lazy(() => import('./modules/portal/PortalDashboardPage'))
const PortalCatalogPage = React.lazy(() => import('./modules/portal/PortalCatalogPage'))
const PortalOrdersPage = React.lazy(() => import('./modules/portal/PortalOrdersPage'))
const PortalInvoicesPage = React.lazy(() => import('./modules/portal/PortalInvoicesPage'))

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
            <Route path="sales/linked-transactions" element={<LinkedTransactionsPage />} />

            {/* GST */}
            <Route path="gst/config" element={<GstConfigPage />} />
            <Route path="gst/einvoice" element={<EInvoicePage />} />
            <Route path="gst/gstr1" element={<Gstr1Page />} />
            <Route path="gst/gstr3b" element={<Gstr3bPage />} />
            <Route path="gst/gstr2a" element={<Gstr2aPage />} />

            {/* Accounts */}
            <Route path="accounts/chart" element={<ChartOfAccountsPage />} />
            <Route path="accounts/journals" element={<JournalEntryPage />} />
            <Route path="accounts/ledger" element={<LedgerPage />} />
            <Route path="accounts/party-statement" element={<PartyStatementPage />} />
            <Route path="accounts/outstanding" element={<AccountsOutstandingPage />} />
            <Route path="accounts/reports" element={<FinancialReportsPage />} />

            {/* Reports */}
            <Route path="reports/sales" element={<SalesReportPage />} />
            <Route path="reports/purchase" element={<PurchaseReportPage />} />
            <Route path="reports/inventory" element={<InventoryReportPage />} />

            {/* HR & Payroll */}
            <Route path="hr/employees" element={<EmployeeListPage />} />
            <Route path="hr/attendance" element={<AttendancePage />} />
            <Route path="hr/leave" element={<LeaveManagementPage />} />
            <Route path="hr/payroll" element={<PayrollPage />} />
            <Route path="hr/org-chart" element={<OrgChartPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

          {/* Portal — uses its own layout */}
          <Route path="portal" element={<PortalLayout />}>
            <Route index element={<Navigate to="/portal/dashboard" replace />} />
            <Route path="dashboard" element={<PortalDashboardPage />} />
            <Route path="catalog" element={<PortalCatalogPage />} />
            <Route path="orders" element={<PortalOrdersPage />} />
            <Route path="invoices" element={<PortalInvoicesPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
