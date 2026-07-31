import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Row, Col, Card, Statistic, Skeleton, Typography, Table } from 'antd'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  RiseOutlined,
  DollarOutlined,
  WarningOutlined,
  InboxOutlined,
  FileTextOutlined,
  AlertOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { getDashboardKpi } from '../../api/modules/reports.api'
import StatusBadge from '../../components/StatusBadge'
import AmountDisplay from '../../components/AmountDisplay'

const { Title } = Typography

interface RecentInvoice {
  id: string
  invoiceNo: string
  customerName: string
  totalAmount: number
  status: string
}

interface RecentBill {
  id: string
  billNo: string
  supplierName: string
  totalAmount: number
  status: string
}

interface SalesTrendMonth {
  month: string
  revenue: number
  invoiceCount?: number
}

interface DashboardKpi {
  todaysSales: number
  monthlyRevenue: number
  outstandingReceivables: number
  lowStockItems: number
  pendingInvoices: number
  expiryAlerts: number
  salesTrend: SalesTrendMonth[]
  recentInvoices: RecentInvoice[]
  recentPurchaseBills: RecentBill[]
}

const invoiceColumns: ColumnsType<RecentInvoice> = [
  {
    title: 'Invoice No',
    dataIndex: 'invoiceNo',
    key: 'invoiceNo',
    render: (v: string) => <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v}</span>,
  },
  {
    title: 'Customer',
    dataIndex: 'customerName',
    key: 'customerName',
  },
  {
    title: 'Amount',
    dataIndex: 'totalAmount',
    key: 'totalAmount',
    align: 'right',
    render: (v: number) => <AmountDisplay amount={v ?? 0} />,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (v: string) => <StatusBadge status={v} />,
  },
]

const billColumns: ColumnsType<RecentBill> = [
  {
    title: 'Bill No',
    dataIndex: 'billNo',
    key: 'billNo',
    render: (v: string) => <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v}</span>,
  },
  {
    title: 'Supplier',
    dataIndex: 'supplierName',
    key: 'supplierName',
  },
  {
    title: 'Amount',
    dataIndex: 'totalAmount',
    key: 'totalAmount',
    align: 'right',
    render: (v: number) => <AmountDisplay amount={v ?? 0} />,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (v: string) => <StatusBadge status={v} />,
  },
]

function KpiCardSkeleton() {
  return (
    <Card>
      <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
    </Card>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['dashboard-kpi'],
    queryFn: () => getDashboardKpi().then((r) => r.data),
    refetchInterval: 60000,
  })

  const kpi: DashboardKpi | undefined = rawData?.data ?? rawData

  const salesTrend: SalesTrendMonth[] = kpi?.salesTrend ?? []
  const recentInvoices: RecentInvoice[] = kpi?.recentInvoices ?? []
  const recentBills: RecentBill[] = kpi?.recentPurchaseBills ?? []

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      {/* KPI Cards — Row 1 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={8}>
          {isLoading ? (
            <KpiCardSkeleton />
          ) : (
            <Card>
              <Statistic
                title="Today's Sales"
                value={kpi?.todaysSales ?? 0}
                prefix={<RiseOutlined />}
                formatter={(val) => `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          )}
        </Col>
        <Col xs={24} sm={12} lg={8}>
          {isLoading ? (
            <KpiCardSkeleton />
          ) : (
            <Card>
              <Statistic
                title="Monthly Revenue"
                value={kpi?.monthlyRevenue ?? 0}
                prefix={<DollarOutlined />}
                formatter={(val) => `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          )}
        </Col>
        <Col xs={24} sm={12} lg={8}>
          {isLoading ? (
            <KpiCardSkeleton />
          ) : (
            <Card>
              <Statistic
                title="Outstanding Receivables"
                value={kpi?.outstandingReceivables ?? 0}
                prefix={<WarningOutlined />}
                formatter={(val) => `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                valueStyle={{ color: (kpi?.outstandingReceivables ?? 0) > 0 ? '#ff4d4f' : '#555' }}
              />
            </Card>
          )}
        </Col>
      </Row>

      {/* KPI Cards — Row 2 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          {isLoading ? (
            <KpiCardSkeleton />
          ) : (
            <Card
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/inventory/alerts')}
              hoverable
            >
              <Statistic
                title="Low Stock Items"
                value={kpi?.lowStockItems ?? 0}
                prefix={<InboxOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          )}
        </Col>
        <Col xs={24} sm={12} lg={8}>
          {isLoading ? (
            <KpiCardSkeleton />
          ) : (
            <Card>
              <Statistic
                title="Pending Invoices"
                value={kpi?.pendingInvoices ?? 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          )}
        </Col>
        <Col xs={24} sm={12} lg={8}>
          {isLoading ? (
            <KpiCardSkeleton />
          ) : (
            <Card
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/inventory/alerts')}
              hoverable
            >
              <Statistic
                title="Expiry Alerts"
                value={kpi?.expiryAlerts ?? 0}
                prefix={<AlertOutlined />}
                valueStyle={{ color: (kpi?.expiryAlerts ?? 0) > 0 ? '#ff4d4f' : '#555' }}
              />
            </Card>
          )}
        </Col>
      </Row>

      {/* Sales Trend Chart */}
      <Card title="Sales Trend (Last 6 Months)" style={{ marginBottom: 24 }}>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={salesTrend}
              margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 13 }} />
              <YAxis
                tickFormatter={(v) =>
                  v === 0 ? '₹0' : `₹${(v / 1000).toFixed(0)}k`
                }
                tick={{ fontSize: 12 }}
                width={60}
              />
              <Tooltip
                formatter={(value: number) =>
                  `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                }
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#1677ff"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Recent Invoices + Recent Purchase Bills */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Recent Invoices" extra={<a onClick={() => navigate('/sales/invoices')} style={{ fontSize: 13 }}>View all</a>}>
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <Table<RecentInvoice>
                columns={invoiceColumns}
                dataSource={recentInvoices.slice(0, 5)}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Recent Purchase Bills" extra={<a onClick={() => navigate('/purchase/bills')} style={{ fontSize: 13 }}>View all</a>}>
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <Table<RecentBill>
                columns={billColumns}
                dataSource={recentBills.slice(0, 5)}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
