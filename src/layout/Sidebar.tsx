import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  TeamOutlined,
  AppstoreOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  AuditOutlined,
  AccountBookOutlined,
  BarChartOutlined,
  SwapOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useUiStore } from '../store/uiStore'
import { useTenant } from '../hooks/useTenant'

const { Sider } = Layout

type MenuItem = Required<MenuProps>['items'][number]

const menuItems: MenuItem[] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/parties',
    icon: <TeamOutlined />,
    label: 'Parties',
  },
  {
    key: '/catalog',
    icon: <AppstoreOutlined />,
    label: 'Catalog',
    children: [
      { key: '/catalog/items', label: 'Items' },
      { key: '/catalog/categories', label: 'Categories' },
    ],
  },
  {
    key: '/inventory',
    icon: <InboxOutlined />,
    label: 'Inventory',
    children: [
      { key: '/inventory/stock', label: 'Stock' },
      { key: '/inventory/stock-entry', label: 'Stock Entry' },
      { key: '/inventory/alerts', label: 'Alerts' },
    ],
  },
  {
    key: '/purchase',
    icon: <ShoppingCartOutlined />,
    label: 'Purchase',
    children: [
      { key: '/purchase/orders', label: 'Orders' },
      { key: '/purchase/grn', label: 'GRN' },
      { key: '/purchase/bills', label: 'Bills' },
    ],
  },
  {
    key: '/sales',
    icon: <FileTextOutlined />,
    label: 'Sales',
    children: [
      { key: '/sales/invoices', label: 'Invoices' },
      { key: '/sales/payments', label: 'Payments' },
      { key: '/sales/outstanding', label: 'Outstanding' },
      { key: '/sales/credit-notes/new', label: 'Credit Notes' },
      { key: '/sales/linked-transactions', label: 'Linked Transactions', icon: <SwapOutlined /> },
    ],
  },
  {
    key: '/gst',
    icon: <AuditOutlined />,
    label: 'GST',
    children: [
      { key: '/gst/config', label: 'Configuration' },
      { key: '/gst/einvoice', label: 'E-Invoice' },
      { key: '/gst/gstr1', label: 'GSTR-1' },
      { key: '/gst/gstr3b', label: 'GSTR-3B' },
      { key: '/gst/gstr2a', label: 'GSTR-2A Reconciliation' },
    ],
  },
  {
    key: '/accounts',
    icon: <AccountBookOutlined />,
    label: 'Accounts',
    children: [
      { key: '/accounts/chart', label: 'Chart of Accounts' },
      { key: '/accounts/journals', label: 'Journal Entries' },
      { key: '/accounts/ledger', label: 'Account Ledger' },
      { key: '/accounts/party-statement', label: 'Party Statement' },
      { key: '/accounts/outstanding', label: 'Outstanding' },
      { key: '/accounts/reports', label: 'Financial Reports' },
    ],
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: 'Reports',
    children: [
      { key: '/reports/sales', label: 'Sales Reports' },
      { key: '/reports/purchase', label: 'Purchase Reports' },
      { key: '/reports/inventory', label: 'Inventory Reports' },
    ],
  },
  {
    key: '/portal',
    icon: <GlobalOutlined />,
    label: 'Portal',
    children: [
      { key: '/portal/dashboard', label: 'Dashboard' },
      { key: '/portal/catalog', label: 'Catalog' },
      { key: '/portal/orders', label: 'My Orders' },
      { key: '/portal/invoices', label: 'My Invoices' },
    ],
  },
]

function getSelectedKey(pathname: string): string {
  if (pathname === '/') return '/'
  const candidates = [
    '/inventory/stock-entry',
    '/inventory/stock',
    '/inventory/alerts',
    '/catalog/items',
    '/catalog/categories',
    '/purchase/orders',
    '/purchase/grn',
    '/purchase/bills',
    '/sales/linked-transactions',
    '/sales/invoices',
    '/sales/payments',
    '/sales/outstanding',
    '/sales/credit-notes',
    '/gst/config',
    '/gst/einvoice',
    '/gst/gstr1',
    '/gst/gstr3b',
    '/gst/gstr2a',
    '/accounts/chart',
    '/accounts/journals',
    '/accounts/ledger',
    '/accounts/party-statement',
    '/accounts/outstanding',
    '/accounts/reports',
    '/portal/dashboard',
    '/portal/catalog',
    '/portal/orders',
    '/portal/invoices',
    '/reports/sales',
    '/reports/purchase',
    '/reports/inventory',
    '/parties',
    '/reports',
  ]
  for (const candidate of candidates) {
    if (pathname.startsWith(candidate)) return candidate
  }
  return '/'
}

// Map leaf paths that redirect elsewhere to their sidebar key
const aliasMap: Record<string, string> = {
  '/sales/credit-notes': '/sales/credit-notes/new',
}

function resolveSelectedKey(pathname: string): string {
  const raw = getSelectedKey(pathname)
  return aliasMap[raw] ?? raw
}

function getOpenKey(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return ''
  return '/' + parts[0]
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed)
  const { tenantName } = useTenant()

  const selectedKey = resolveSelectedKey(location.pathname)
  const openKey = getOpenKey(location.pathname)

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  return (
    <Sider
      collapsed={sidebarCollapsed}
      width={240}
      collapsedWidth={80}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {sidebarCollapsed ? (
          <span style={{ fontSize: 18, fontWeight: 700 }}>E</span>
        ) : (
          <>
            <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>ERP Platform</span>
            <span
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.2,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {tenantName}
            </span>
          </>
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={openKey ? [openKey] : []}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </Sider>
  )
}
