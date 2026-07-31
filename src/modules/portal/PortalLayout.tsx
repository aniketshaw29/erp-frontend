import { Layout, Menu, Avatar, Dropdown, Space, Tag, Typography } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  DashboardOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useAuthStore } from '../../store/authStore'
import { useTenant } from '../../hooks/useTenant'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const portalMenuItems: MenuProps['items'] = [
  {
    key: '/portal/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/portal/catalog',
    icon: <AppstoreOutlined />,
    label: 'Catalog',
  },
  {
    key: '/portal/orders',
    icon: <ShoppingCartOutlined />,
    label: 'My Orders',
  },
  {
    key: '/portal/invoices',
    icon: <FileTextOutlined />,
    label: 'My Invoices',
  },
  {
    key: '/portal/outstanding',
    icon: <WalletOutlined />,
    label: 'Outstanding',
  },
]

function getSelectedKey(pathname: string): string {
  const candidates = [
    '/portal/dashboard',
    '/portal/catalog',
    '/portal/orders',
    '/portal/invoices',
    '/portal/outstanding',
  ]
  for (const candidate of candidates) {
    if (pathname.startsWith(candidate)) return candidate
  }
  return '/portal/dashboard'
}

export default function PortalLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const { tenantName } = useTenant()

  const selectedKey = getSelectedKey(location.pathname)

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ]

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      clearAuth()
      navigate('/login')
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 4,
            padding: '0 16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            Retailer Portal
          </span>
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
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={portalMenuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout style={{ marginLeft: 220 }}>
        <Header
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            left: 220,
            zIndex: 99,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Space>
            <Tag color="blue" style={{ fontWeight: 600, fontSize: 13 }}>
              Portal — {tenantName}
            </Tag>
          </Space>

          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} size="small" style={{ background: '#1677ff' }} />
              <Text style={{ fontSize: 13 }}>{user?.name ?? 'User'}</Text>
            </Space>
          </Dropdown>
        </Header>

        <Content
          style={{
            marginTop: 64,
            padding: 24,
            minHeight: 'calc(100vh - 64px)',
            background: '#f5f5f5',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
