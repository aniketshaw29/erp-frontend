import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Row, Col, Select, Button, Tag, Card, Statistic, message, Typography, Tabs } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import { getWarehouses } from '../../api/modules/inventory.api'
import {
  getStockOnHandReport,
  getExpiryReport,
  getSlowMovingItems,
  getStockValuation,
  downloadStockOnHandExcel,
} from '../../api/modules/reports.api'

const { Text } = Typography

// ─── Stock on Hand Tab ────────────────────────────────────────────────────────

interface StockOnHandRow {
  id: string
  itemCode: string
  itemName: string
  category: string
  warehouseName: string
  batchNo?: string
  expiryDate?: string
  qty: number
  reorderLevel?: number
  value: number
}

function StockOnHandTab() {
  const [warehouseId, setWarehouseId] = useState<string | undefined>(undefined)
  const [downloading, setDownloading] = useState(false)

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  })

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['report-stock-on-hand', warehouseId],
    queryFn: () => getStockOnHandReport(warehouseId).then((r) => r.data),
  })

  const rows: StockOnHandRow[] = rawData?.data ?? rawData ?? []

  const columns: ColumnsType<StockOnHandRow> = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Name', dataIndex: 'itemName' },
    { title: 'Category', dataIndex: 'category', render: (v?: string) => v || <Text type="secondary">—</Text> },
    { title: 'Warehouse', dataIndex: 'warehouseName' },
    { title: 'Batch', dataIndex: 'batchNo', render: (v?: string) => v || <Text type="secondary">—</Text> },
    {
      title: 'Expiry',
      dataIndex: 'expiryDate',
      render: (v?: string) => v ? dayjs(v).format('DD MMM YYYY') : <Text type="secondary">—</Text>,
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      align: 'right',
      render: (v: number, record) => {
        const isLow = (record.reorderLevel != null) && v <= record.reorderLevel
        return (
          <span style={{ color: isLow ? '#ff4d4f' : 'inherit', fontWeight: isLow ? 600 : 400 }}>
            {v}
          </span>
        )
      },
    },
    {
      title: 'Value',
      dataIndex: 'value',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
  ]

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await downloadStockOnHandExcel(warehouseId)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `stock-on-hand.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      message.error('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const warehouseOptions = [
    { value: '', label: 'All Warehouses' },
    ...(warehousesData ?? []).map((w) => ({ value: w.id, label: w.name })),
  ]

  return (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }} align="middle" justify="space-between">
        <Col>
          <Select
            value={warehouseId ?? ''}
            onChange={(v) => setWarehouseId(v || undefined)}
            options={warehouseOptions}
            style={{ width: 200 }}
            placeholder="All Warehouses"
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
      />
    </div>
  )
}

// ─── Expiry Tab ────────────────────────────────────────────────────────────────

interface ExpiryRow {
  id: string
  itemName: string
  batchNo?: string
  mfgDate?: string
  expiryDate?: string
  daysRemaining?: number
  qty: number
  warehouseName: string
}

function ExpiryTab() {
  const [withinDays, setWithinDays] = useState<number>(30)

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['report-expiry', withinDays],
    queryFn: () => getExpiryReport(withinDays).then((r) => r.data),
  })

  const rows: ExpiryRow[] = [...(rawData?.data ?? rawData ?? [])].sort((a: ExpiryRow, b: ExpiryRow) => {
    const da = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity
    const db = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity
    return da - db
  })

  const columns: ColumnsType<ExpiryRow> = [
    { title: 'Item', dataIndex: 'itemName' },
    { title: 'Batch No', dataIndex: 'batchNo', render: (v?: string) => v || <Text type="secondary">—</Text> },
    {
      title: 'Mfg Date',
      dataIndex: 'mfgDate',
      render: (v?: string) => v ? dayjs(v).format('DD MMM YYYY') : <Text type="secondary">—</Text>,
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      render: (v?: string) => v ? dayjs(v).format('DD MMM YYYY') : <Text type="secondary">—</Text>,
    },
    {
      title: 'Days Remaining',
      dataIndex: 'daysRemaining',
      render: (days?: number) => {
        if (days == null) return <Text type="secondary">—</Text>
        const color = days <= 7 ? 'red' : days <= 30 ? 'orange' : days <= 90 ? 'gold' : 'green'
        return <Tag color={color}>{days} days</Tag>
      },
    },
    { title: 'Qty', dataIndex: 'qty', align: 'right' },
    { title: 'Warehouse', dataIndex: 'warehouseName' },
  ]

  const daysOptions = [
    { value: 30, label: 'Within 30 days' },
    { value: 60, label: 'Within 60 days' },
    { value: 90, label: 'Within 90 days' },
    { value: 180, label: 'Within 180 days' },
  ]

  return (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col>
          <Select
            value={withinDays}
            onChange={setWithinDays}
            options={daysOptions}
            style={{ width: 180 }}
          />
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

// ─── Slow Moving Tab ───────────────────────────────────────────────────────────

interface SlowMovingRow {
  id: string
  itemName: string
  itemCode: string
  lastSaleDate?: string
  daysSinceSale?: number
  stockQty: number
  value: number
}

function SlowMovingTab() {
  const [days, setDays] = useState<number>(30)

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['report-slow-moving', days],
    queryFn: () => getSlowMovingItems(days).then((r) => r.data),
  })

  const rows: SlowMovingRow[] = rawData?.data ?? rawData ?? []

  const columns: ColumnsType<SlowMovingRow> = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Item', dataIndex: 'itemName' },
    {
      title: 'Last Sale Date',
      dataIndex: 'lastSaleDate',
      render: (v?: string) => v ? dayjs(v).format('DD MMM YYYY') : <Text type="secondary">Never</Text>,
    },
    {
      title: 'Days Since Sale',
      dataIndex: 'daysSinceSale',
      align: 'right',
      render: (v?: number) => {
        if (v == null) return <Text type="secondary">—</Text>
        const color = v > 90 ? '#ff4d4f' : v > 60 ? '#fa8c16' : '#faad14'
        return <span style={{ color, fontWeight: 600 }}>{v}</span>
      },
    },
    { title: 'Stock Qty', dataIndex: 'stockQty', align: 'right' },
    {
      title: 'Value',
      dataIndex: 'value',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
  ]

  const daysOptions = [
    { value: 30, label: 'No sales in 30 days' },
    { value: 60, label: 'No sales in 60 days' },
    { value: 90, label: 'No sales in 90 days' },
  ]

  return (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col>
          <Select
            value={days}
            onChange={setDays}
            options={daysOptions}
            style={{ width: 200 }}
          />
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

// ─── Valuation Tab ─────────────────────────────────────────────────────────────

interface ValuationRow {
  id: string
  itemName: string
  category: string
  totalQty: number
  avgRate: number
  totalValue: number
}

interface ValuationSummary {
  totalStockValue: number
  byItemType: Array<{ type: string; value: number }>
}

interface ValuationData {
  summary: ValuationSummary
  items: ValuationRow[]
}

function ValuationTab() {
  const { data: rawData, isLoading } = useQuery({
    queryKey: ['report-stock-valuation'],
    queryFn: () => getStockValuation().then((r) => r.data),
  })

  const data: ValuationData | undefined = rawData?.data ?? rawData
  const rows: ValuationRow[] = data?.items ?? []

  const columns: ColumnsType<ValuationRow> = [
    { title: 'Item', dataIndex: 'itemName' },
    { title: 'Category', dataIndex: 'category', render: (v?: string) => v || <Text type="secondary">—</Text> },
    { title: 'Total Qty', dataIndex: 'totalQty', align: 'right' },
    {
      title: 'Avg Rate',
      dataIndex: 'avgRate',
      align: 'right',
      render: (v: number) => (
        v != null
          ? <span>₹{Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          : <Text type="secondary">—</Text>
      ),
    },
    {
      title: 'Total Value',
      dataIndex: 'totalValue',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card size="small">
            <Statistic
              title="Total Stock Value"
              value={data?.summary?.totalStockValue ?? 0}
              formatter={(v) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              valueStyle={{ color: '#1677ff', fontSize: 20 }}
            />
          </Card>
        </Col>
        {(data?.summary?.byItemType ?? []).map((bt) => (
          <Col xs={24} sm={12} lg={6} key={bt.type}>
            <Card size="small">
              <Statistic
                title={bt.type}
                value={bt.value}
                formatter={(v) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                valueStyle={{ fontSize: 16 }}
              />
            </Card>
          </Col>
        ))}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InventoryReportPage() {
  return (
    <div>
      <PageHeader title="Inventory Reports" />
      <Tabs
        defaultActiveKey="stock-on-hand"
        items={[
          { key: 'stock-on-hand', label: 'Stock on Hand', children: <StockOnHandTab /> },
          { key: 'expiry', label: 'Expiry', children: <ExpiryTab /> },
          { key: 'slow-moving', label: 'Slow Moving', children: <SlowMovingTab /> },
          { key: 'valuation', label: 'Valuation', children: <ValuationTab /> },
        ]}
      />
    </div>
  )
}
