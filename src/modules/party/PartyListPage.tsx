import { useState } from 'react'
import type { MouseEvent } from 'react'
import { Button, Input, Select, Space, Tag, Modal, message } from 'antd'
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import { getParties, deleteParty } from '../../api/modules/party.api'
import type { Party, PartyType } from '../../types/party.types'
import { usePagination } from '../../hooks/usePagination'
import PartyFormDrawer from './PartyFormDrawer'

const { Option } = Select

const partyTypeColors: Record<PartyType, string> = {
  VENDOR: 'blue',
  CUSTOMER: 'green',
  BOTH: 'purple',
}

export default function PartyListPage() {
  const [search, setSearch] = useState('')
  const [partyType, setPartyType] = useState<string | undefined>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingParty, setEditingParty] = useState<Party | null>(null)
  const { page, pageSize, onPageChange } = usePagination()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['parties', page, pageSize, search, partyType],
    queryFn: () => getParties({ page, size: pageSize, search, partyType }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteParty,
    onSuccess: () => {
      message.success('Party deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['parties'] })
    },
    onError: () => {
      message.error('Failed to delete party')
    },
  })

  const handleNewParty = () => {
    setEditingParty(null)
    setDrawerOpen(true)
  }

  const handleRowClick = (record: Party) => {
    setEditingParty(record)
    setDrawerOpen(true)
  }

  const handleDeleteConfirm = (id: string, e: MouseEvent) => {
    e.stopPropagation()
    Modal.confirm({
      title: 'Delete Party',
      content: 'Are you sure you want to delete this party? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteMutation.mutate(id),
    })
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditingParty(null)
  }

  const columns: ColumnsType<Party> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Type',
      dataIndex: 'partyType',
      key: 'partyType',
      render: (type: PartyType) => <Tag color={partyTypeColors[type]}>{type}</Tag>,
    },
    {
      title: 'GSTIN',
      dataIndex: 'gstin',
      key: 'gstin',
      render: (v?: string) => v || '—',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (v?: string) => v || '—',
    },
    {
      title: 'Credit Limit',
      dataIndex: 'creditLimit',
      key: 'creditLimit',
      align: 'right',
      render: (amount: number) => <AmountDisplay amount={amount ?? 0} />,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size={4} onClick={(e) => e.stopPropagation()}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              setEditingParty(record)
              setDrawerOpen(true)
            }}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            loading={deleteMutation.isPending && deleteMutation.variables === record.id}
            onClick={(e) => handleDeleteConfirm(record.id, e)}
          />
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Parties"
        subtitle="Manage vendors, customers, and business associates"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewParty}>
            New Party
          </Button>
        }
      />

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search parties..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
          allowClear
        />
        <Select
          placeholder="Filter by type"
          value={partyType}
          onChange={setPartyType}
          allowClear
          style={{ width: 160 }}
        >
          <Option value="VENDOR">Vendor</Option>
          <Option value="CUSTOMER">Customer</Option>
          <Option value="BOTH">Both</Option>
        </Select>
      </Space>

      <ErpTable<Party>
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

      <PartyFormDrawer
        open={drawerOpen}
        party={editingParty}
        onClose={handleDrawerClose}
      />
    </div>
  )
}
