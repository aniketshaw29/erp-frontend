import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Row, Col, Button, Typography } from 'antd'
import { DatePicker, Tabs } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import {
  getSupplierWisePurchases,
  getItemWisePurchases,
} from '../../api/modules/reports.api'

const { RangePicker } = DatePicker
const { Text } = Typography

// ─── Supplier-wise Tab ────────────────────────────────────────────────────────

interface SupplierRow {
  id: string
  supplierName: string
  invoiceCount: number
  totalAmount: number
  paid: number
  outstanding: number
}

function SupplierWiseTab() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs()])

  const from = range[0].format('YYYY-MM-DD')
  const to = range[1].format('YYYY-MM-DD')

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['report-supplier-purchases', from, to],
    queryFn: () => getSupplierWisePurchases(from, to).then((r) => r.data),
  })

  const rows: SupplierRow[] = rawData?.data ?? rawData ?? []

  const columns: ColumnsType<SupplierRow> = [
    { title: 'Supplier', dataIndex: 'supplierName' },
    { title: 'Invoices', dataIndex: 'invoiceCount', align: 'right' },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
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

// ─── Item-wise Tab ────────────────────────────────────────────────────────────

interface ItemRow {
  id: string
  itemCode: string
  itemName: string
  qty: number
  purchaseValue: number
  avgRate: number
}

function ItemWiseTab() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs()])

  const from = range[0].format('YYYY-MM-DD')
  const to = range[1].format('YYYY-MM-DD')

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['report-item-purchases', from, to],
    queryFn: () => getItemWisePurchases(from, to).then((r) => r.data),
  })

  const rows: ItemRow[] = rawData?.data ?? rawData ?? []

  const columns: ColumnsType<ItemRow> = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Item Name', dataIndex: 'itemName' },
    { title: 'Qty', dataIndex: 'qty', align: 'right' },
    {
      title: 'Purchase Value',
      dataIndex: 'purchaseValue',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PurchaseReportPage() {
  return (
    <div>
      <PageHeader title="Purchase Reports" />
      <Tabs
        defaultActiveKey="supplier"
        items={[
          { key: 'supplier', label: 'Supplier-wise', children: <SupplierWiseTab /> },
          { key: 'item', label: 'Item-wise', children: <ItemWiseTab /> },
        ]}
      />
    </div>
  )
}
