import { Button, Typography, Table, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '../../components/PageHeader'
import { getAlerts } from '../../api/modules/inventory.api'
import type { StockAlert } from '../../types/inventory.types'

const { Title } = Typography

export default function AlertsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: getAlerts,
  })

  const lowStockAlerts = data?.filter((a) => a.alertType === 'LOW_STOCK') ?? []
  const expiryAlerts = data?.filter((a) => a.alertType === 'EXPIRY') ?? []

  const lowStockColumns: ColumnsType<StockAlert> = [
    {
      title: 'Item',
      key: 'item',
      render: (_, record) => (
        <span>
          <strong>{record.itemCode}</strong> — {record.itemName}
        </span>
      ),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
    },
    {
      title: 'Qty On Hand',
      dataIndex: 'qtyOnHand',
      key: 'qtyOnHand',
      align: 'right',
      render: (v?: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{v ?? '—'}</span>
      ),
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorderLevel',
      key: 'reorderLevel',
      align: 'right',
    },
    {
      title: 'Severity',
      key: 'severity',
      render: (_, record) => {
        const qty = record.qtyOnHand ?? 0
        const reorder = record.reorderLevel ?? 0
        const color = qty === 0 ? 'red' : qty < reorder * 0.5 ? 'orange' : 'gold'
        const label = qty === 0 ? 'CRITICAL' : qty < reorder * 0.5 ? 'LOW' : 'WARNING'
        return <Tag color={color}>{label}</Tag>
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Button size="small" disabled>
          Create PO
        </Button>
      ),
    },
  ]

  const expiryColumns: ColumnsType<StockAlert> = [
    {
      title: 'Item',
      key: 'item',
      render: (_, record) => (
        <span>
          <strong>{record.itemCode}</strong> — {record.itemName}
        </span>
      ),
    },
    {
      title: 'Batch No',
      dataIndex: 'batchNo',
      key: 'batchNo',
      render: (v?: string) => v || '—',
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (v?: string) => (v ? new Date(v).toLocaleDateString('en-IN') : '—'),
    },
    {
      title: 'Days Remaining',
      dataIndex: 'daysUntilExpiry',
      key: 'daysUntilExpiry',
      render: (days?: number) => {
        if (days === undefined) return '—'
        const color = days <= 7 ? 'red' : days <= 30 ? 'orange' : 'green'
        return <Tag color={color}>{days} days</Tag>
      },
    },
    {
      title: 'Qty',
      dataIndex: 'qtyOnHand',
      key: 'qtyOnHand',
      align: 'right',
      render: (v?: number) => v ?? '—',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Stock Alerts"
        subtitle="Low stock and expiry warnings"
      />

      <Title level={5} style={{ marginBottom: 12 }}>
        Low Stock Alerts
      </Title>
      <Table<StockAlert>
        columns={lowStockColumns}
        dataSource={lowStockAlerts}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        style={{ marginBottom: 32 }}
        scroll={{ x: 'max-content' }}
      />

      <Title level={5} style={{ marginBottom: 12 }}>
        Expiry Alerts
      </Title>
      <Table<StockAlert>
        columns={expiryColumns}
        dataSource={expiryAlerts}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}
