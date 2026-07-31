import { Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import { getStock } from '../../api/modules/inventory.api'
import type { StockEntry, StockStatus } from '../../types/inventory.types'
import { usePagination } from '../../hooks/usePagination'

const statusTagColors: Record<StockStatus, string> = {
  OK: 'green',
  LOW: 'orange',
  CRITICAL: 'red',
}

export default function StockListPage() {
  const { page, pageSize, onPageChange } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['stock', page, pageSize],
    queryFn: () => getStock({ page, size: pageSize }),
  })

  const columns: ColumnsType<StockEntry> = [
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
      title: 'Batch No',
      dataIndex: 'batchNo',
      key: 'batchNo',
      render: (v?: string) => v || '—',
    },
    {
      title: 'Expiry',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (v?: string) => (v ? new Date(v).toLocaleDateString('en-IN') : '—'),
    },
    {
      title: 'Qty On Hand',
      dataIndex: 'qtyOnHand',
      key: 'qtyOnHand',
      align: 'right',
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorderLevel',
      key: 'reorderLevel',
      align: 'right',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: StockStatus) => (
        <Tag color={statusTagColors[status]}>{status}</Tag>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Stock Levels"
        subtitle="Current inventory across all warehouses"
      />

      <ErpTable<StockEntry>
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
