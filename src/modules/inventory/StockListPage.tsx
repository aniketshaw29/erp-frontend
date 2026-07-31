import { useState } from 'react'
import { Select, Space } from 'antd'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import { getStock, getWarehouses } from '../../api/modules/inventory.api'
import type { Stock } from '../../types/inventory.types'
import { usePagination } from '../../hooks/usePagination'

const { Option } = Select

function ExpiryCell({ expiryDate }: { expiryDate?: string }) {
  if (!expiryDate) return <span>—</span>
  const days = Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const color = days < 30 ? '#ff4d4f' : days < 90 ? '#fa8c16' : undefined
  return (
    <span style={{ color }}>
      {new Date(expiryDate).toLocaleDateString('en-IN')}
      {days < 90 && (
        <span style={{ fontSize: 11, marginLeft: 4 }}>({days}d)</span>
      )}
    </span>
  )
}

function QtyCell({ qty, reorderLevel }: { qty: number; reorderLevel: number }) {
  const color = qty <= reorderLevel ? '#ff4d4f' : undefined
  return <span style={{ color, fontWeight: qty <= reorderLevel ? 600 : undefined }}>{qty}</span>
}

export default function StockListPage() {
  const [warehouseId, setWarehouseId] = useState<string | undefined>()
  const { page, pageSize, onPageChange } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['stock', page, pageSize, warehouseId],
    queryFn: () => getStock({ page, size: pageSize, warehouseId }),
  })

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  })

  const columns: ColumnsType<Stock> = [
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
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
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (v?: string) => <ExpiryCell expiryDate={v} />,
    },
    {
      title: 'Qty On Hand',
      dataIndex: 'qtyOnHand',
      key: 'qtyOnHand',
      align: 'right',
      render: (qty: number, record: Stock) => (
        <QtyCell qty={qty} reorderLevel={record.reorderLevel} />
      ),
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorderLevel',
      key: 'reorderLevel',
      align: 'right',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Stock Levels"
        subtitle="Current inventory across all warehouses"
      />

      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by warehouse"
          value={warehouseId}
          onChange={setWarehouseId}
          allowClear
          style={{ width: 220 }}
        >
          {warehouses?.map((w) => (
            <Option key={w.id} value={w.id}>
              {w.name}
            </Option>
          ))}
        </Select>
      </Space>

      <ErpTable<Stock>
        columns={columns}
        dataSource={data?.data}
        loading={isLoading}
        pagination={{
          total: data?.meta.total ?? 0,
          page,
          pageSize,
        }}
        onPageChange={onPageChange}
        rowKey="id"
      />
    </div>
  )
}
