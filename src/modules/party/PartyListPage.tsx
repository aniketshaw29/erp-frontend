import { useState } from 'react'
import { Button, Input, Select, Space, Tag } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import { getParties } from '../../api/modules/party.api'
import type { Party, PartyType } from '../../types/party.types'
import { usePagination } from '../../hooks/usePagination'

const { Option } = Select

const partyTypeColors: Record<PartyType, string> = {
  VENDOR: 'blue',
  CUSTOMER: 'green',
  BOTH: 'purple',
}

export default function PartyListPage() {
  const [search, setSearch] = useState('')
  const [partyType, setPartyType] = useState<string | undefined>()
  const { page, pageSize, onPageChange } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['parties', page, pageSize, search, partyType],
    queryFn: () => getParties({ page, size: pageSize, search, partyType }),
  })

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
      render: (type: PartyType) => (
        <Tag color={partyTypeColors[type]}>{type}</Tag>
      ),
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
      title: 'Outstanding',
      dataIndex: 'outstandingAmount',
      key: 'outstandingAmount',
      align: 'right',
      render: (amount: number) => <AmountDisplay amount={amount} />,
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
        title="Parties"
        subtitle="Manage vendors, customers, and business associates"
        actions={
          <Button type="primary" icon={<PlusOutlined />}>
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
      />
    </div>
  )
}
