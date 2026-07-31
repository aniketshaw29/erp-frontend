import { useState, useEffect, useRef } from 'react'
import { Layout, Button, Avatar, Dropdown, Badge, Space, Breadcrumb, Drawer, List, Typography, Empty, Input, message } from 'antd'
import type { InputRef } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  BellFilled,
  AlertOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useUiStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { getUnreadCount, getNotifications, markAsRead, markAllAsRead } from '../api/modules/notifications.api'

dayjs.extend(relativeTime)

const { Header } = Layout
const { Text } = Typography

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
  portal: 'Portal',
  dashboard: 'Dashboard',
  'linked-transactions': 'Linked Transactions',
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

function useGlobalSearch() {
  const searchRef = useRef<InputRef | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const modifier = isMac ? e.metaKey : e.ctrlKey
      if (modifier && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return searchRef
}

interface Notification {
  id: string
  type: 'BELL' | 'ALERT' | 'LINK' | string
  title: string
  message: string
  createdAt: string
  read: boolean
}

function NotificationIcon({ type }: { type: string }) {
  if (type === 'ALERT') return <AlertOutlined style={{ color: '#faad14' }} />
  if (type === 'LINK') return <LinkOutlined style={{ color: '#1677ff' }} />
  return <BellFilled style={{ color: '#1677ff' }} />
}

export default function Topbar() {
  const navigate = useNavigate()
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const breadcrumbs = useBreadcrumbs()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const queryClient = useQueryClient()
  const searchRef = useGlobalSearch()

  const { data: countData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => getUnreadCount().then((r) => r.data),
    refetchInterval: 30000,
  })

  const unreadCount: number = countData?.data?.count ?? countData?.count ?? 0

  const { data: notificationsData, isLoading: notifLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications().then((r) => r.data),
    enabled: drawerOpen,
  })

  const notifications: Notification[] = notificationsData?.data ?? notificationsData ?? []

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })

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
    <>
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

        {/* Global Search — center */}
        <Input.Search
          ref={searchRef}
          placeholder="Search… (Ctrl+K / ⌘K)"
          style={{ width: 300 }}
          allowClear
          onSearch={() => {
            message.info('Search coming soon')
          }}
        />

        <Space size={16} align="center">
          <Badge count={unreadCount} showZero={false}>
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: 18 }} />}
              onClick={() => setDrawerOpen(true)}
            />
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

      <Drawer
        title="Notifications"
        placement="right"
        width={400}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button
            size="small"
            type="link"
            onClick={() => markAllReadMutation.mutate()}
            loading={markAllReadMutation.isPending}
            disabled={notifications.every((n) => n.read)}
          >
            Mark all read
          </Button>
        }
      >
        {!notifLoading && notifications.length === 0 ? (
          <Empty description="No notifications" style={{ marginTop: 48 }} />
        ) : (
          <List
            loading={notifLoading}
            dataSource={[...notifications].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )}
            renderItem={(item) => (
              <List.Item
                style={{
                  borderLeft: item.read ? 'none' : '3px solid #1677ff',
                  paddingLeft: item.read ? 0 : 12,
                  background: item.read ? 'transparent' : '#f0f7ff',
                  cursor: item.read ? 'default' : 'pointer',
                  marginBottom: 4,
                  borderRadius: 4,
                }}
                onClick={() => {
                  if (!item.read) {
                    markReadMutation.mutate(item.id)
                  }
                }}
              >
                <List.Item.Meta
                  avatar={<NotificationIcon type={item.type} />}
                  title={
                    <Text strong style={{ fontSize: 13 }}>
                      {item.title}
                    </Text>
                  }
                  description={
                    <div>
                      <div style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>
                        {item.message}
                      </div>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {dayjs(item.createdAt).fromNow()}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </>
  )
}
