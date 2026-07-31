import { Row, Col, Card, Statistic, Typography } from 'antd'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  RiseOutlined,
  WarningOutlined,
  InboxOutlined,
  FileTextOutlined,
} from '@ant-design/icons'

const { Title } = Typography

const monthlySalesData = [
  { month: 'Feb', sales: 0, purchases: 0 },
  { month: 'Mar', sales: 0, purchases: 0 },
  { month: 'Apr', sales: 0, purchases: 0 },
  { month: 'May', sales: 0, purchases: 0 },
  { month: 'Jun', sales: 0, purchases: 0 },
  { month: 'Jul', sales: 0, purchases: 0 },
]

export default function DashboardPage() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Today's Sales"
              value={0}
              prefix={<RiseOutlined />}
              formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Outstanding"
              value={0}
              prefix={<WarningOutlined />}
              formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={0}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Invoices"
              value={0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Monthly Sales vs Purchases (Last 6 Months)" style={{ marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlySalesData} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 13 }} />
            <YAxis
              tickFormatter={(v) => (v === 0 ? '₹0' : `₹${(v / 1000).toFixed(0)}k`)}
              tick={{ fontSize: 13 }}
            />
            <Tooltip
              formatter={(value: number) =>
                `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
              }
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend />
            <Bar
              dataKey="sales"
              name="Sales"
              fill="#1677ff"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="purchases"
              name="Purchases"
              fill="#52c41a"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
