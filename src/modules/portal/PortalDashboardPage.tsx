import { Row, Col, Card, Statistic, Table, Button, Typography } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import StatusBadge from '../../components/StatusBadge'
import { getPortalDashboard } from '../../api/modules/portal.api'

const { Text } = Typography

interface DashboardData {
  totalOrders: number
  totalInvoices: number
  outstandingBalance: number
  recentOrders: RecentOrder[]
  recentInvoices: RecentInvoice[]
}

interface RecentOrder {
  id: string
  orderNo: string
  date: string
  amount: number
  status: string
}

interface RecentInvoice {
  id: string
  invoiceNo: string
  date: string
  amount: number
  status: string
}

export default function PortalDashboardPage() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['portal-dashboard'],
    queryFn: () => getPortalDashboard().then((r) => r.data),
  })

  const dashboard: DashboardData = dashboardData?.data ?? dashboardData ?? {
    totalOrders: 0,
    totalInvoices: 0,
    outstandingBalance: 0,
    recentOrders: [],
    recentInvoices: [],
  }

  const handleDownloadInvoicePdf = (id: string) => {
    window.open(`/api/v1/portal/invoices/${id}/pdf`, '_blank')
  }

  const orderColumns: ColumnsType<RecentOrder> = [
    {
      title: 'Order No',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (val: string) => <Text strong>{val}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount: number) => <AmountDisplay amount={amount} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
  ]

  const invoiceColumns: ColumnsType<RecentInvoice> = [
    {
      title: 'Invoice No',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      render: (val: string) => <Text strong>{val}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount: number) => <AmountDisplay amount={amount} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, record) => (
        <Button
          size="small"
          icon={<DownloadOutlined />}
          onClick={() => handleDownloadInvoicePdf(record.id)}
        >
          PDF
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Portal Dashboard" subtitle="Your orders and invoices at a glance" />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card loading={isLoading}>
            <Statistic title="Total Orders" value={dashboard.totalOrders} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={isLoading}>
            <Statistic title="Total Invoices" value={dashboard.totalInvoices} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={isLoading}>
            <Statistic
              title="Outstanding Balance"
              value={dashboard.outstandingBalance}
              formatter={(val) =>
                `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
              }
              valueStyle={dashboard.outstandingBalance > 0 ? { color: '#ff4d4f' } : {}}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Orders (Last 5)" loading={isLoading}>
            <Table<RecentOrder>
              columns={orderColumns}
              dataSource={dashboard.recentOrders}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Invoices (Last 5)" loading={isLoading}>
            <Table<RecentInvoice>
              columns={invoiceColumns}
              dataSource={dashboard.recentInvoices}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
