import { useState } from 'react'
import { Button, Tabs, Tag, Drawer, Descriptions, Space, Popconfirm, message } from 'antd'
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import StatusBadge from '../../components/StatusBadge'
import {
  getPurchaseOrders,
  getPurchaseOrder,
  submitPurchaseOrder,
  cancelPurchaseOrder,
} from '../../api/modules/purchase.api'
import type { PurchaseOrder, PurchaseOrderStatus } from '../../types/purchase.types'
import { usePagination } from '../../hooks/usePagination'

const statusOptions: Array<{ label: string; key: PurchaseOrderStatus | 'ALL' }> = [
  { label: 'All', key: 'ALL' },
  { label: 'Draft', key: 'DRAFT' },
  { label: 'Submitted', key: 'SUBMITTED' },
  { label: 'Partial', key: 'PARTIAL' },
  { label: 'Received', key: 'RECEIVED' },
  { label: 'Cancelled', key: 'CANCELLED' },
]

export default function PurchaseOrderListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'ALL'>('ALL')
  const { page, pageSize, onPageChange } = usePagination()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', page, pageSize, statusFilter],
    queryFn: () =>
      getPurchaseOrders({
        page,
        size: pageSize,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }).then((r) => r.data),
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['purchase-order', selectedId],
    queryFn: () => getPurchaseOrder(selectedId!).then((r) => r.data.data),
    enabled: !!selectedId,
  })

  const submitMutation = useMutation({
    mutationFn: (id: string) => submitPurchaseOrder(id),
    onSuccess: () => {
      message.success('Purchase order submitted')
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-order', selectedId] })
    },
    onError: () => message.error('Failed to submit order'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelPurchaseOrder(id),
    onSuccess: () => {
      message.success('Purchase order cancelled')
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-order', selectedId] })
    },
    onError: () => message.error('Failed to cancel order'),
  })

  const openDrawer = (record: PurchaseOrder) => {
    setSelectedId(record.id)
    setDrawerOpen(true)
  }

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: 'PO No',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (val: string, record) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => openDrawer(record)}>
          {val}
        </Button>
      ),
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
      render: (_: unknown, record) => (
        <Tag>{record.lines?.length ?? 0} {(record.lines?.length ?? 0) === 1 ? 'item' : 'items'}</Tag>
      ),
    },
    {
      title: 'Grand Total',
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
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: unknown, record) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          {record.status === 'DRAFT' && (
            <Popconfirm
              title="Submit this purchase order?"
              onConfirm={() => submitMutation.mutate(record.id)}
              okText="Submit"
            >
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}>
                Submit
              </Button>
            </Popconfirm>
          )}
          {(record.status === 'DRAFT' || record.status === 'SUBMITTED') && (
            <Popconfirm
              title="Cancel this purchase order?"
              onConfirm={() => cancelMutation.mutate(record.id)}
              okText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<CloseCircleOutlined />}>
                Cancel
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const detail = detailData

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Manage procurement from vendors"
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/purchase/orders/new')}
          >
            New PO
          </Button>
        }
      />

      <Tabs
        activeKey={statusFilter}
        onChange={(key) => {
          setStatusFilter(key as PurchaseOrderStatus | 'ALL')
          onPageChange(1, pageSize)
        }}
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
        onRowClick={openDrawer}
      />

      <Drawer
        title={detail ? `PO: ${detail.poNumber}` : 'Purchase Order Detail'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={600}
        loading={detailLoading}
        extra={
          detail && (
            <Space>
              {detail.status === 'DRAFT' && (
                <>
                  <Button
                    type="default"
                    onClick={() => {
                      setDrawerOpen(false)
                      navigate(`/purchase/orders/${detail.id}/edit`)
                    }}
                  >
                    Edit
                  </Button>
                  <Popconfirm
                    title="Submit this purchase order?"
                    onConfirm={() => submitMutation.mutate(detail.id)}
                    okText="Submit"
                  >
                    <Button type="primary">Submit</Button>
                  </Popconfirm>
                </>
              )}
              {(detail.status === 'DRAFT' || detail.status === 'SUBMITTED') && (
                <Popconfirm
                  title="Cancel this purchase order?"
                  onConfirm={() => cancelMutation.mutate(detail.id)}
                  okText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger>Cancel</Button>
                </Popconfirm>
              )}
            </Space>
          )
        }
      >
        {detail && (
          <>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="PO Number" span={2}>{detail.poNumber}</Descriptions.Item>
              <Descriptions.Item label="Supplier" span={2}>{detail.supplierName}</Descriptions.Item>
              <Descriptions.Item label="Order Date">
                {new Date(detail.orderDate).toLocaleDateString('en-IN')}
              </Descriptions.Item>
              <Descriptions.Item label="Expected Delivery">
                {detail.expectedDeliveryDate
                  ? new Date(detail.expectedDeliveryDate).toLocaleDateString('en-IN')
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <StatusBadge status={detail.status} />
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <strong>Line Items</strong>
              <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #f0f0f0' }}>Item</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #f0f0f0' }}>Qty</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #f0f0f0' }}>Rate</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #f0f0f0' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.lines?.map((line) => (
                    <tr key={line.id}>
                      <td style={{ padding: '6px 8px', border: '1px solid #f0f0f0' }}>{line.itemName}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #f0f0f0' }}>{line.qty}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #f0f0f0' }}>
                        <AmountDisplay amount={line.rate} />
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #f0f0f0' }}>
                        <AmountDisplay amount={line.lineTotal} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Descriptions column={2} size="small" style={{ marginTop: 16 }}>
              <Descriptions.Item label="Subtotal">
                <AmountDisplay amount={detail.subtotal} />
              </Descriptions.Item>
              <Descriptions.Item label="Total GST">
                <AmountDisplay amount={detail.totalGst} />
              </Descriptions.Item>
              <Descriptions.Item label="Grand Total" span={2}>
                <strong><AmountDisplay amount={detail.grandTotal} /></strong>
              </Descriptions.Item>
            </Descriptions>

            {detail.notes && (
              <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
                <Descriptions.Item label="Notes">{detail.notes}</Descriptions.Item>
              </Descriptions>
            )}
          </>
        )}
      </Drawer>
    </div>
  )
}
