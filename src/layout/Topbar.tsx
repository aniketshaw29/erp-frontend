import { Layout, Button, Avatar, Dropdown, Badge, Space, Breadcrumb } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'

const { Header } = Layout

const ROUTE_LABELS: Record<string, string> = {
  '': 'Dashboard',
  parties: 'Parties',
  catalog: 'Catalog',
  items: 'Items',
  categories: 'Categories',
  inventory: 'Inventory',
  stock: 'Stock',
  'stock-entry': 'Stock Entry',
  alerts: 'Alerts',
  purchase: 'Purchase',
  orders: 'Orders',
  grn: 'GRN',
  bills: 'Bills',
  sales: 'Sales',
  invoices: 'Invoices',
  payments: 'Payments',
  gst: 'GST',
  einvoice: 'E-Invoice',
  gstr1: 'GSTR-1',
  accounts: 'Accounts',
  ledger: 'Ledger',
  outstanding: 'Outstanding',
  reports: 'Reports',
  new: 'New',
}

function useBreadcrumbs() {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)

  if (parts.length === 0) {
    return [{ title: 'Dashboard' }]
  }

  const crumbs: { title: string }[] = [{ title: 'Home' }]
  parts.forEach((part) => {
    crumbs.push({ title: ROUTE_LABELS[part] ?? part })
  })
  return crumbs
}

export default function Topbar() {
  const navigate = useNavigate()
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const breadcrumbs = useBreadcrumbs()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ]

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      handleLogout()
    }
  }

  return (
    <Header
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: sidebarCollapsed ? 80 : 240,
        zIndex: 99,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        transition: 'left 0.2s',
      }}
    >
      <Space size={16} align="center">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          style={{ fontSize: 16 }}
        />
        <Breadcrumb items={breadcrumbs} style={{ fontSize: 13 }} />
      </Space>

      <Space size={16} align="center">
        <Badge count={0} showZero={false}>
          <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
        </Badge>
        <Dropdown
          menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} size="small" style={{ background: '#1677ff' }} />
            <span style={{ fontSize: 13 }}>{user?.name ?? 'User'}</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  )
}
