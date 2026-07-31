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
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useUiStore } from '../store/uiStore'

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
    ],
  },
  {
    key: '/gst',
    icon: <AuditOutlined />,
    label: 'GST',
    children: [
      { key: '/gst/einvoice', label: 'E-Invoice' },
      { key: '/gst/gstr1', label: 'GSTR-1' },
    ],
  },
  {
    key: '/accounts',
    icon: <AccountBookOutlined />,
    label: 'Accounts',
    children: [
      { key: '/accounts/ledger', label: 'Ledger' },
      { key: '/accounts/outstanding', label: 'Outstanding' },
    ],
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: 'Reports',
  },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed)

  const selectedKey = location.pathname === '/' ? '/' : '/' + location.pathname.split('/').filter(Boolean)[0] + (location.pathname.split('/').length > 2 ? '/' + location.pathname.split('/').filter(Boolean)[1] : '')

  const openKey = '/' + location.pathname.split('/').filter(Boolean)[0]

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
          fontSize: sidebarCollapsed ? 16 : 20,
          fontWeight: 700,
          padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {sidebarCollapsed ? 'ERP' : 'ERP Platform'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey, location.pathname]}
        defaultOpenKeys={[openKey]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </Sider>
  )
}
