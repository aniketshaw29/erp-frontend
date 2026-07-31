import { useState } from 'react'
import { Button, Tabs, Space, Popconfirm, message, Typography } from 'antd'
import { PlusOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import StatusBadge from '../../components/StatusBadge'
import { getInvoices, getInvoicePdf, submitInvoice, cancelInvoice } from '../../api/modules/sales.api'
import type { Invoice, InvoiceStatus } from '../../types/sales.types'
import { usePagination } from '../../hooks/usePagination'

const { Text } = Typography

const statusOptions: Array<{ label: string; key: InvoiceStatus | 'ALL' }> = [
  { label: 'All', key: 'ALL' },
  { label: 'Draft', key: 'DRAFT' },
  { label: 'Submitted', key: 'SUBMITTED' },
  { label: 'Partially Paid', key: 'PARTIAL' },
  { label: 'Paid', key: 'PAID' },
  { label: 'Cancelled', key: 'CANCELLED' },
]

export default function InvoiceListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL')
  const { page, pageSize, onPageChange } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, pageSize, statusFilter],
    queryFn: () =>
      getInvoices({
        page,
        size: pageSize,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }).then((r) => r.data),
  })

  const submitMutation = useMutation({
    mutationFn: (id: string) => submitInvoice(id),
    onSuccess: () => {
      message.success('Invoice submitted')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: () => message.error('Failed to submit invoice'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelInvoice(id),
    onSuccess: () => {
      message.success('Invoice cancelled')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: () => message.error('Failed to cancel invoice'),
  })

  const handleDownloadPdf = async (id: string, invoiceNo: string) => {
    try {
      const res = await getInvoicePdf(id)
      const url = URL.createObjectURL(res.data as Blob)
      window.open(url, '_blank')
      // clean up after short delay to allow tab to open
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch {
      message.error('Failed to download PDF')
    }
  }

  const isOverdue = (invoice: Invoice) => {
    if (!invoice.dueDate) return false
    return (
      dayjs(invoice.dueDate).isBefore(dayjs(), 'day') &&
      invoice.status !== 'PAID' &&
      invoice.status !== 'CANCELLED'
    )
  }

  const columns: ColumnsType<Invoice> = [
    {
      title: 'Invoice No',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      render: (val: string) => <Text strong>{val}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
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
      width: 200,
      render: (_: unknown, record) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadPdf(record.id, record.invoiceNo)}
          >
            PDF
          </Button>
          {record.status === 'DRAFT' && (
            <Popconfirm
              title="Submit this invoice?"
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
              title="Cancel this invoice?"
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

  return (
    <div>
      <PageHeader
        title="Sales Invoices"
        subtitle="Manage customer invoices"
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/sales/invoices/new')}
          >
            New Invoice
          </Button>
        }
      />

      <Tabs
        activeKey={statusFilter}
        onChange={(key) => {
          setStatusFilter(key as InvoiceStatus | 'ALL')
          onPageChange(1, pageSize)
        }}
        items={statusOptions.map((s) => ({ key: s.key, label: s.label }))}
        style={{ marginBottom: 16 }}
      />

      <ErpTable<Invoice>
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
