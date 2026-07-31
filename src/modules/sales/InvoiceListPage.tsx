import { useState } from 'react'
import { Button, Tabs } from 'antd'
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import StatusBadge from '../../components/StatusBadge'
import { getInvoices, getInvoicePdf } from '../../api/modules/sales.api'
import type { Invoice, InvoiceStatus } from '../../types/sales.types'
import { usePagination } from '../../hooks/usePagination'

const statusOptions: Array<{ label: string; key: InvoiceStatus | 'ALL' }> = [
  { label: 'All', key: 'ALL' },
  { label: 'Draft', key: 'DRAFT' },
  { label: 'Submitted', key: 'SUBMITTED' },
  { label: 'Partial', key: 'PARTIAL' },
  { label: 'Paid', key: 'PAID' },
  { label: 'Cancelled', key: 'CANCELLED' },
]

export default function InvoiceListPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL')
  const { page, pageSize, onPageChange } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, pageSize, statusFilter],
    queryFn: () =>
      getInvoices({
        page,
        size: pageSize,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  })

  const handleDownloadPdf = async (id: string, invoiceNo: string) => {
    const blob = await getInvoicePdf(id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoiceNo}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns: ColumnsType<Invoice> = [
    {
      title: 'Invoice No',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
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
      title: 'Amount',
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
      render: (_, record) => (
        <Button
          size="small"
          icon={<DownloadOutlined />}
          onClick={() => handleDownloadPdf(record.id, record.invoiceNo)}
        >
          PDF
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Sales Invoices"
        subtitle="Manage customer invoices"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/sales/invoices/new')}>
            New Invoice
          </Button>
        }
      />

      <Tabs
        activeKey={statusFilter}
        onChange={(key) => setStatusFilter(key as InvoiceStatus | 'ALL')}
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
