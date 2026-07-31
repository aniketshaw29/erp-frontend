import { useState } from 'react'
import {
  Button,
  Tabs,
  Space,
  Popconfirm,
  message,
  Modal,
  Form,
  InputNumber,
  Select,
  Typography,
} from 'antd'
import { PlusOutlined, DollarOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import StatusBadge from '../../components/StatusBadge'
import { getPurchaseBills, recordBillPayment } from '../../api/modules/purchase.api'
import { getParties } from '../../api/modules/party.api'
import type { PurchaseBill, BillStatus } from '../../types/purchase.types'
import { usePagination } from '../../hooks/usePagination'

const { Text } = Typography

const statusOptions: Array<{ label: string; key: BillStatus | 'ALL' }> = [
  { label: 'All', key: 'ALL' },
  { label: 'Draft', key: 'DRAFT' },
  { label: 'Submitted', key: 'SUBMITTED' },
  { label: 'Partial', key: 'PARTIAL' },
  { label: 'Paid', key: 'PAID' },
  { label: 'Overdue', key: 'OVERDUE' },
  { label: 'Cancelled', key: 'CANCELLED' },
]

export default function PurchaseBillListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<BillStatus | 'ALL'>('ALL')
  const [supplierFilter, setSupplierFilter] = useState<string | undefined>()
  const { page, pageSize, onPageChange } = usePagination()
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; bill: PurchaseBill | null }>({
    open: false,
    bill: null,
  })
  const [payForm] = Form.useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-bills', page, pageSize, statusFilter, supplierFilter],
    queryFn: () =>
      getPurchaseBills({
        page,
        size: pageSize,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        supplierId: supplierFilter,
      }).then((r) => r.data),
  })

  const { data: suppliersData } = useQuery({
    queryKey: ['parties-vendors'],
    queryFn: () => getParties({ size: 200, partyType: 'VENDOR' }).then((r) => r.data),
  })

  const payMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      recordBillPayment(id, amount),
    onSuccess: () => {
      message.success('Payment recorded')
      queryClient.invalidateQueries({ queryKey: ['purchase-bills'] })
      setPaymentModal({ open: false, bill: null })
      payForm.resetFields()
    },
    onError: () => message.error('Failed to record payment'),
  })

  const openPaymentModal = (bill: PurchaseBill) => {
    setPaymentModal({ open: true, bill })
    payForm.setFieldValue('amount', bill.outstandingAmount)
  }

  const handlePaymentSubmit = async () => {
    const values = await payForm.validateFields()
    if (paymentModal.bill) {
      payMutation.mutate({ id: paymentModal.bill.id, amount: values.amount })
    }
  }

  const isOverdue = (bill: PurchaseBill) => {
    if (!bill.dueDate) return false
    return (
      dayjs(bill.dueDate).isBefore(dayjs(), 'day') &&
      bill.status !== 'PAID' &&
      bill.status !== 'CANCELLED'
    )
  }

  const columns: ColumnsType<PurchaseBill> = [
    {
      title: 'Bill No',
      dataIndex: 'billNumber',
      key: 'billNumber',
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
    },
    {
      title: 'Bill Date',
      dataIndex: 'billDate',
      key: 'billDate',
      render: (date: string) => new Date(date).toLocaleDateString('en-IN'),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string | undefined, record) => {
        if (!date) return '—'
        const overdue = isOverdue(record)
        return (
          <Text style={overdue ? { color: '#ff4d4f', fontWeight: 600 } : {}}>
            {new Date(date).toLocaleDateString('en-IN')}
            {overdue && ' (OVERDUE)'}
          </Text>
        )
      },
    },
    {
      title: 'Grand Total',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      align: 'right',
      render: (amount: number) => <AmountDisplay amount={amount} />,
    },
    {
      title: 'Paid',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      align: 'right',
      render: (amount: number) => <AmountDisplay amount={amount} />,
    },
    {
      title: 'Outstanding',
      dataIndex: 'outstandingAmount',
      key: 'outstandingAmount',
      align: 'right',
      render: (amount: number, record) => (
        <Text style={isOverdue(record) && amount > 0 ? { color: '#ff4d4f' } : {}}>
          <AmountDisplay amount={amount} />
        </Text>
      ),
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
      width: 140,
      render: (_: unknown, record) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          {(record.status === 'SUBMITTED' || record.status === 'PARTIAL' || record.status === 'OVERDUE') &&
            record.outstandingAmount > 0 && (
              <Button
                size="small"
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => openPaymentModal(record)}
              >
                Pay
              </Button>
            )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Purchase Bills"
        subtitle="Manage supplier invoices and payments"
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/purchase/bills/new')}
          >
            New Bill
          </Button>
        }
      />

      <div style={{ display: 'flex', gap: 16, marginBottom: 8, alignItems: 'center' }}>
        <Select
          showSearch
          allowClear
          placeholder="Filter by supplier"
          optionFilterProp="label"
          style={{ width: 240 }}
          options={suppliersData?.data?.map((p) => ({ value: p.id, label: p.name }))}
          onChange={(val) => {
            setSupplierFilter(val)
            onPageChange(1, pageSize)
          }}
        />
      </div>

      <Tabs
        activeKey={statusFilter}
        onChange={(key) => {
          setStatusFilter(key as BillStatus | 'ALL')
          onPageChange(1, pageSize)
        }}
        items={statusOptions.map((s) => ({ key: s.key, label: s.label }))}
        style={{ marginBottom: 16 }}
      />

      <ErpTable<PurchaseBill>
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

      <Modal
        title={`Record Payment — ${paymentModal.bill?.billNumber}`}
        open={paymentModal.open}
        onCancel={() => {
          setPaymentModal({ open: false, bill: null })
          payForm.resetFields()
        }}
        onOk={handlePaymentSubmit}
        confirmLoading={payMutation.isPending}
        okText="Record Payment"
      >
        {paymentModal.bill && (
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">Outstanding: </Text>
            <Text strong><AmountDisplay amount={paymentModal.bill.outstandingAmount} /></Text>
          </div>
        )}
        <Form form={payForm} layout="vertical">
          <Form.Item
            name="amount"
            label="Payment Amount"
            rules={[
              { required: true, message: 'Enter amount' },
              {
                validator: (_, value) => {
                  if (
                    paymentModal.bill &&
                    value > paymentModal.bill.outstandingAmount
                  ) {
                    return Promise.reject('Amount exceeds outstanding')
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <InputNumber
              min={0.01}
              precision={2}
              style={{ width: '100%' }}
              prefix="₹"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
