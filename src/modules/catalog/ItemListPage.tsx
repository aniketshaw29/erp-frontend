import { useState } from 'react'
import { Button, Input, Select, Space, Tag } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import { getItems } from '../../api/modules/catalog.api'
import type { Item, ItemType } from '../../types/catalog.types'
import { usePagination } from '../../hooks/usePagination'
import ItemFormDrawer from './ItemFormDrawer'

const { Option } = Select

const itemTypeColors: Record<ItemType, string> = {
  STOCK: 'blue',
  CONSUMABLE: 'orange',
  SERVICE: 'green',
}

export default function ItemListPage() {
  const [search, setSearch] = useState('')
  const [itemType, setItemType] = useState<string | undefined>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const { page, pageSize, onPageChange } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['items', page, pageSize, search, itemType],
    queryFn: () => getItems({ page, size: pageSize, search, itemType }),
  })

  const handleNewItem = () => {
    setEditingItem(null)
    setDrawerOpen(true)
  }

  const handleRowClick = (record: Item) => {
    setEditingItem(record)
    setDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditingItem(null)
  }

  const columns: ColumnsType<Item> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Type',
      dataIndex: 'itemType',
      key: 'itemType',
      render: (type: ItemType) => <Tag color={itemTypeColors[type]}>{type}</Tag>,
    },
    {
      title: 'GST Rate',
      dataIndex: 'gstRate',
      key: 'gstRate',
      align: 'right',
      render: (rate: number) => `${rate}%`,
    },
    {
      title: 'Selling Rate',
      dataIndex: 'standardRate',
      key: 'standardRate',
      align: 'right',
      render: (rate: number) => <AmountDisplay amount={rate ?? 0} />,
    },
    {
      title: 'Tracking',
      dataIndex: 'trackingType',
      key: 'trackingType',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Items"
        subtitle="Manage your product catalog"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewItem}>
            New Item
          </Button>
        }
      />

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search items..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
          allowClear
        />
        <Select
          placeholder="Filter by type"
          value={itemType}
          onChange={setItemType}
          allowClear
          style={{ width: 160 }}
        >
          <Option value="STOCK">Stock</Option>
          <Option value="CONSUMABLE">Consumable</Option>
          <Option value="SERVICE">Service</Option>
        </Select>
      </Space>

      <ErpTable<Item>
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
        onRowClick={handleRowClick}
      />

      <ItemFormDrawer
        open={drawerOpen}
        item={editingItem}
        onClose={handleDrawerClose}
      />
    </div>
  )
}
