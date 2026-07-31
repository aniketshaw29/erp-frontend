import { useState } from 'react'
import { Tabs, Button, Space, message, Modal, Form, Input, Tooltip, Typography } from 'antd'
import { CheckOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import StatusBadge from '../../components/StatusBadge'
import {
  getInboundTransactions,
  getOutboundTransactions,
  acceptTransaction,
  rejectTransaction,
} from '../../api/modules/sales.api'

const { Text } = Typography

interface LinkedTransaction {
  id: string
  sellerName?: string
  buyerName?: string
  invoiceNo: string
  invoiceDate: string
  amount: number
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | string
  createdAt: string
  acceptedAt?: string
  rejectedAt?: string
}

interface RejectModalState {
  open: boolean
  transactionId: string | null
}

export default function LinkedTransactionsPage() {
  const queryClient = useQueryClient()
  const [rejectModal, setRejectModal] = useState<RejectModalState>({ open: false, transactionId: null })
  const [rejectForm] = Form.useForm()

  const { data: inboundData, isLoading: inboundLoading } = useQuery({
    queryKey: ['linked-transactions-inbound'],
    queryFn: () => getInboundTransactions().then((r) => r.data),
  })

  const { data: outboundData, isLoading: outboundLoading } = useQuery({
    queryKey: ['linked-transactions-outbound'],
    queryFn: () => getOutboundTransactions().then((r) => r.data),
  })

  const inbound: LinkedTransaction[] = inboundData?.data ?? inboundData ?? []
  const outbound: LinkedTransaction[] = outboundData?.data ?? outboundData ?? []

  const acceptMutation = useMutation({
    mutationFn: (id: string) => acceptTransaction(id),
    onSuccess: () => {
      message.success('Stock credited to your inventory')
      queryClient.invalidateQueries({ queryKey: ['linked-transactions-inbound'] })
    },
    onError: () => message.error('Failed to accept transaction'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectTransaction(id, reason),
    onSuccess: () => {
      message.success('Transaction rejected')
      setRejectModal({ open: false, transactionId: null })
      rejectForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['linked-transactions-inbound'] })
    },
    onError: () => message.error('Failed to reject transaction'),
  })

  const handleRejectSubmit = async () => {
    const values = await rejectForm.validateFields()
    if (rejectModal.transactionId) {
      rejectMutation.mutate({ id: rejectModal.transactionId, reason: values.reason })
    }
  }

  const inboundColumns: ColumnsType<LinkedTransaction> = [
    {
      title: 'Seller',
      dataIndex: 'sellerName',
      key: 'sellerName',
      render: (val: string) => <Text strong>{val}</Text>,
    },
    {
      title: 'Invoice No',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
    },
    {
      title: 'Invoice Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
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
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: unknown, record) => {
        if (record.status !== 'PENDING') return null
        return (
          <Space size="small" onClick={(e) => e.stopPropagation()}>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => acceptMutation.mutate(record.id)}
              loading={acceptMutation.isPending && acceptMutation.variables === record.id}
            >
              Accept
            </Button>
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => setRejectModal({ open: true, transactionId: record.id })}
            >
              Reject
            </Button>
          </Space>
        )
      },
    },
  ]

  const outboundColumns: ColumnsType<LinkedTransaction> = [
    {
      title: (
        <Space>
          Buyer
          <Tooltip title="When a buyer on this platform receives your invoice, they see a purchase draft">
            <InfoCircleOutlined style={{ color: '#1677ff' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'buyerName',
      key: 'buyerName',
      render: (val: string) => <Text strong>{val}</Text>,
    },
    {
      title: 'Invoice No',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
    },
    {
      title: 'Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
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
      title: 'Accepted/Rejected At',
      key: 'resolvedAt',
      render: (_: unknown, record) => {
        const date = record.acceptedAt ?? record.rejectedAt
        if (!date) return '—'
        return dayjs(date).format('DD/MM/YYYY HH:mm')
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Linked Transactions"
        subtitle="Inter-tenant transactions auto-created from platform invoices"
      />

      <Tabs
        defaultActiveKey="inbound"
        items={[
          {
            key: 'inbound',
            label: 'Inbound (Purchases)',
            children: (
              <ErpTable<LinkedTransaction>
                columns={inboundColumns}
                dataSource={inbound}
                loading={inboundLoading}
                rowKey="id"
              />
            ),
          },
          {
            key: 'outbound',
            label: 'Outbound (Your Invoices)',
            children: (
              <ErpTable<LinkedTransaction>
                columns={outboundColumns}
                dataSource={outbound}
                loading={outboundLoading}
                rowKey="id"
              />
            ),
          },
        ]}
      />

      <Modal
        title="Reject Transaction"
        open={rejectModal.open}
        onOk={handleRejectSubmit}
        onCancel={() => {
          setRejectModal({ open: false, transactionId: null })
          rejectForm.resetFields()
        }}
        okButtonProps={{ danger: true, loading: rejectMutation.isPending }}
        okText="Reject"
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Reason for rejection"
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <Input.TextArea rows={4} placeholder="Enter reason for rejecting this transaction..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
