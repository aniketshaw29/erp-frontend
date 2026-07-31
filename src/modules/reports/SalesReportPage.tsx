import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  Tabs,
  DatePicker,
  Select,
  Row,
  Col,
  Statistic,
  Button,
  message,
  Typography,
} from 'antd'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import StatusBadge from '../../components/StatusBadge'
import {
  getDailySales,
  getMonthlySales,
  getProductWiseSales,
  getCustomerWiseSales,
  getSalesTrend,
  downloadProductSalesExcel,
} from '../../api/modules/reports.api'

const { RangePicker } = DatePicker
const { Text } = Typography

// ─── Daily Tab ────────────────────────────────────────────────────────────────

interface DailySalesData {
  totalInvoices: number
  revenue: number
  tax: number
  collected: number
  outstanding: number
  invoices: Array<{
    id: string
    invoiceNo: string
    customerName: string
    totalAmount: number
    status: string
  }>
}

function DailyTab() {
  const [date, setDate] = useState<Dayjs>(dayjs())

  const dateStr = date.format('YYYY-MM-DD')

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['report-daily-sales', dateStr],
    queryFn: () => getDailySales(dateStr).then((r) => r.data),
  })

  const data: DailySalesData | undefined = rawData?.data ?? rawData

  const invoiceColumns: ColumnsType<NonNullable<DailySalesData['invoices']>[number]> = [
    {
      title: 'Invoice No',
      dataIndex: 'invoiceNo',
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (v: string) => <StatusBadge status={v} />,
    },
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }} align="middle">
        <Col>
          <DatePicker
            value={date}
            onChange={(d) => d && setDate(d)}
            allowClear={false}
            style={{ width: 180 }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: 'Total Invoices', value: data?.totalInvoices ?? 0, prefix: '', color: '#1677ff', isMoney: false },
          { title: 'Revenue', value: data?.revenue ?? 0, prefix: '₹', color: '#52c41a', isMoney: true },
          { title: 'Tax Collected', value: data?.tax ?? 0, prefix: '₹', color: '#722ed1', isMoney: true },
          { title: 'Amount Collected', value: data?.collected ?? 0, prefix: '₹', color: '#13c2c2', isMoney: true },
          { title: 'Outstanding', value: data?.outstanding ?? 0, prefix: '₹', color: '#ff4d4f', isMoney: true },
        ].map((item) => (
          <Col xs={24} sm={12} lg={4} key={item.title}>
            <Card size="small">
              <Statistic
                title={item.title}
                value={item.value}
                valueStyle={{ color: item.color, fontSize: 18 }}
                formatter={
                  item.isMoney
                    ? (v) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    : undefined
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Invoices for the Day" size="small">
        <ErpTable
          columns={invoiceColumns}
          dataSource={data?.invoices ?? []}
          loading={isLoading}
          rowKey="id"
        />
      </Card>
    </div>
  )
}

// ─── Monthly Tab ──────────────────────────────────────────────────────────────

interface DayRow {
  date: string
  invoices: number
  revenue: number
  tax: number
}

interface MonthlySalesData {
  days: DayRow[]
  totalRevenue: number
  totalInvoices: number
  totalTax: number
}

function MonthlyTab() {
  const now = dayjs()
  const [month, setMonth] = useState<number>(now.month() + 1)
  const [year, setYear] = useState<number>(now.year())

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['report-monthly-sales', month, year],
    queryFn: () => getMonthlySales(month, year).then((r) => r.data),
  })

  const data: MonthlySalesData | undefined = rawData?.data ?? rawData
  const rows: DayRow[] = data?.days ?? []

  const columns: ColumnsType<DayRow> = [
    {
      title: 'Date',
      dataIndex: 'date',
      render: (v: string) => dayjs(v).format('DD MMM YYYY'),
    },
    { title: 'Invoices', dataIndex: 'invoices', align: 'right' },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
    {
      title: 'Tax',
      dataIndex: 'tax',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
  ]

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const years = Array.from({ length: 5 }, (_, i) => now.year() - i)

  return (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }} align="middle">
        <Col>
          <Select
            value={month}
            onChange={setMonth}
            style={{ width: 140 }}
            options={months.map((m, i) => ({ value: i + 1, label: m }))}
          />
        </Col>
        <Col>
          <Select
            value={year}
            onChange={setYear}
            style={{ width: 100 }}
            options={years.map((y) => ({ value: y, label: String(y) }))}
          />
        </Col>
      </Row>

      <Card title="Day-wise Revenue" style={{ marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={rows} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => dayjs(v).format('D')}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickFormatter={(v) => (v === 0 ? '₹0' : `₹${(v / 1000).toFixed(0)}k`)}
              tick={{ fontSize: 11 }}
              width={60}
            />
            <Tooltip
              formatter={(value: number) =>
                `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
              }
              labelFormatter={(label) => dayjs(label).format('DD MMM')}
            />
            <Bar dataKey="revenue" name="Revenue" fill="#1677ff" radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <ErpTable
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        rowKey="date"
      />
    </div>
  )
}

// ─── Product-wise Tab ─────────────────────────────────────────────────────────

interface ProductRow {
  id: string
  itemCode: string
  itemName: string
  qtySold: number
  revenue: number
  tax: number
  invoiceCount: number
}

function ProductWiseTab() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs()])
  const [downloading, setDownloading] = useState(false)

  const from = range[0].format('YYYY-MM-DD')
  const to = range[1].format('YYYY-MM-DD')

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['report-product-sales', from, to],
    queryFn: () => getProductWiseSales(from, to).then((r) => r.data),
  })

  const rows: ProductRow[] = (rawData?.data ?? rawData ?? []).sort(
    (a: ProductRow, b: ProductRow) => (b.revenue ?? 0) - (a.revenue ?? 0),
  )

  const columns: ColumnsType<ProductRow> = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Item Name', dataIndex: 'itemName' },
    { title: 'Qty Sold', dataIndex: 'qtySold', align: 'right' },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
    {
      title: 'Tax',
      dataIndex: 'tax',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
    { title: 'Invoices', dataIndex: 'invoiceCount', align: 'right' },
  ]

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await downloadProductSalesExcel(from, to)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `product-sales-${from}-${to}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      message.error('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }} align="middle" justify="space-between">
        <Col>
          <RangePicker
            value={range}
            onChange={(v) => v && setRange(v as [Dayjs, Dayjs])}
            allowClear={false}
          />
        </Col>
        <Col>
          <Button onClick={handleDownload} loading={downloading}>
            Download Excel
          </Button>
        </Col>
      </Row>

      <ErpTable
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        rowKey="id"
        onRowClick={undefined}
      />
    </div>
  )
}

// ─── Customer-wise Tab ────────────────────────────────────────────────────────

interface CustomerRow {
  id: string
  customerName: string
  gstin: string
  invoiceCount: number
  revenue: number
  paid: number
  outstanding: number
}

function CustomerWiseTab() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs()])

  const from = range[0].format('YYYY-MM-DD')
  const to = range[1].format('YYYY-MM-DD')

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['report-customer-sales', from, to],
    queryFn: () => getCustomerWiseSales(from, to).then((r) => r.data),
  })

  const rows: CustomerRow[] = rawData?.data ?? rawData ?? []

  const columns: ColumnsType<CustomerRow> = [
    { title: 'Customer', dataIndex: 'customerName' },
    {
      title: 'GSTIN',
      dataIndex: 'gstin',
      render: (v?: string) => v || <Text type="secondary">—</Text>,
    },
    { title: 'Invoices', dataIndex: 'invoiceCount', align: 'right' },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
    {
      title: 'Paid',
      dataIndex: 'paid',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
    {
      title: 'Outstanding',
      dataIndex: 'outstanding',
      align: 'right',
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#ff4d4f' : 'inherit', fontWeight: v > 0 ? 600 : 400 }}>
          <AmountDisplay amount={v ?? 0} />
        </span>
      ),
    },
  ]

  return (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }} align="middle" justify="space-between">
        <Col>
          <RangePicker
            value={range}
            onChange={(v) => v && setRange(v as [Dayjs, Dayjs])}
            allowClear={false}
          />
        </Col>
        <Col>
          <Button disabled>Download Excel</Button>
        </Col>
      </Row>

      <ErpTable
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        rowKey="id"
      />
    </div>
  )
}

// ─── Trend Tab ────────────────────────────────────────────────────────────────

interface TrendMonth {
  month: string
  revenue: number
  invoiceCount: number
}

function TrendTab() {
  const { data: rawData, isLoading } = useQuery({
    queryKey: ['report-sales-trend-12'],
    queryFn: () => getSalesTrend(12).then((r) => r.data),
  })

  const rows: TrendMonth[] = rawData?.data ?? rawData ?? []

  return (
    <div>
      <Card title="Last 12 Months — Revenue Trend">
        {isLoading ? (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Loading...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={rows} margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="revenue"
                tickFormatter={(v) => (v === 0 ? '₹0' : `₹${(v / 1000).toFixed(0)}k`)}
                tick={{ fontSize: 11 }}
                width={64}
              />
              <YAxis
                yAxisId="count"
                orientation="right"
                tick={{ fontSize: 11 }}
                width={40}
                label={{ value: 'Invoices', angle: -90, position: 'insideRight', offset: 10, fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'Revenue'
                    ? `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    : value
                }
              />
              <Legend />
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#1677ff"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="count"
                type="monotone"
                dataKey="invoiceCount"
                name="Invoice Count"
                stroke="#52c41a"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SalesReportPage() {
  return (
    <div>
      <PageHeader title="Sales Reports" />
      <Tabs
        defaultActiveKey="daily"
        items={[
          { key: 'daily', label: 'Daily', children: <DailyTab /> },
          { key: 'monthly', label: 'Monthly', children: <MonthlyTab /> },
          { key: 'product', label: 'Product-wise', children: <ProductWiseTab /> },
          { key: 'customer', label: 'Customer-wise', children: <CustomerWiseTab /> },
          { key: 'trend', label: 'Trend', children: <TrendTab /> },
        ]}
      />
    </div>
  )
}
