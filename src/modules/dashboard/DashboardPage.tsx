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
  DollarOutlined,
  WarningOutlined,
  InboxOutlined,
  FileTextOutlined,
} from '@ant-design/icons'

const { Title } = Typography

const monthlySalesData = [
  { month: 'Jan', sales: 420000, purchases: 280000 },
  { month: 'Feb', sales: 380000, purchases: 310000 },
  { month: 'Mar', sales: 510000, purchases: 340000 },
  { month: 'Apr', sales: 470000, purchases: 290000 },
  { month: 'May', sales: 620000, purchases: 410000 },
  { month: 'Jun', sales: 580000, purchases: 380000 },
  { month: 'Jul', sales: 710000, purchases: 460000 },
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
              value={84500}
              prefix={<DollarOutlined />}
              formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Outstanding Receivables"
              value={342000}
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
              value={12}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Invoices"
              value={28}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Monthly Sales vs Purchases" style={{ marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={monthlySalesData} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 13 }} />
            <YAxis
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 13 }}
            />
            <Tooltip
              formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend />
            <Bar dataKey="sales" name="Sales" fill="#1677ff" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="purchases" name="Purchases" fill="#52c41a" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
