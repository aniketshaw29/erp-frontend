import { useState } from 'react'
import { Button, Tabs, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import StatusBadge from '../../components/StatusBadge'
import { getPurchaseOrders } from '../../api/modules/purchase.api'
import type { PurchaseOrder, PurchaseOrderStatus } from '../../types/purchase.types'
import { usePagination } from '../../hooks/usePagination'

const statusOptions: Array<{ label: string; key: PurchaseOrderStatus | 'ALL' }> = [
  { label: 'All', key: 'ALL' },
  { label: 'Draft', key: 'DRAFT' },
  { label: 'Submitted', key: 'SUBMITTED' },
  { label: 'Received', key: 'RECEIVED' },
]

export default function PurchaseOrderListPage() {
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'ALL'>('ALL')
  const { page, pageSize, onPageChange } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', page, pageSize, statusFilter],
    queryFn: () =>
      getPurchaseOrders({
        page,
        size: pageSize,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  })

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: 'PO No',
      dataIndex: 'poNumber',
      key: 'poNumber',
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
    },
    {
      title: 'Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => new Date(date).toLocaleDateString('en-IN'),
    },
    {
      title: 'Items',
      key: 'items',
      render: (_, record) => (
        <Tag>{record.lines.length} {record.lines.length === 1 ? 'item' : 'items'}</Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
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

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Manage procurement from vendors"
        actions={
          <Button type="primary" icon={<PlusOutlined />}>
            New PO
          </Button>
        }
      />

      <Tabs
        activeKey={statusFilter}
        onChange={(key) => setStatusFilter(key as PurchaseOrderStatus | 'ALL')}
        items={statusOptions.map((s) => ({ key: s.key, label: s.label }))}
        style={{ marginBottom: 16 }}
      />

      <ErpTable<PurchaseOrder>
        columns={columns}
        dataSource={data?.data}
        loading={isLoading}
        pagination={{
          total: data?.meta.total ?? 0,
          page,
          pageSize,
        }}
        onPageChange={onPageChange}
      />
    </div>
  )
}
