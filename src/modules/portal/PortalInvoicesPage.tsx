import { Card, Button, Typography, Row, Col } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import StatusBadge from '../../components/StatusBadge'
import { getMyInvoices, getMyOutstanding } from '../../api/modules/portal.api'
import { usePagination } from '../../hooks/usePagination'

const { Text } = Typography

interface PortalInvoice {
  id: string
  invoiceNo: string
  date: string
  dueDate?: string
  totalAmount: number
  outstanding: number
  status: string
}

export default function PortalInvoicesPage() {
  const { page, pageSize, onPageChange } = usePagination()

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['portal-invoices', page, pageSize],
    queryFn: () => getMyInvoices({ page, size: pageSize }).then((r) => r.data),
  })

  const { data: outstandingData } = useQuery({
    queryKey: ['portal-outstanding'],
    queryFn: () => getMyOutstanding().then((r) => r.data),
  })

  const invoices: PortalInvoice[] = invoicesData?.data ?? invoicesData ?? []
  const totalCount: number = invoicesData?.meta?.total ?? invoices.length
  const totalOutstanding: number =
    outstandingData?.data?.total ?? outstandingData?.total ?? 0

  const handleDownloadPdf = (id: string) => {
    window.open(`/api/v1/portal/invoices/${id}/pdf`, '_blank')
  }

  const columns: ColumnsType<PortalInvoice> = [
    {
      title: 'Invoice No',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      render: (val: string) => <Text strong>{val}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string | undefined) => (date ? dayjs(date).format('DD/MM/YYYY') : '—'),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (amount: number) => <AmountDisplay amount={amount} />,
    },
    {
      title: 'Outstanding',
      dataIndex: 'outstanding',
      key: 'outstanding',
      align: 'right',
      render: (amount: number) => (
        <Text style={amount > 0 ? { color: '#ff4d4f', fontWeight: 600 } : {}}>
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
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, record) => (
        <Button
          size="small"
          icon={<DownloadOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            handleDownloadPdf(record.id)
          }}
        >
          PDF
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="My Invoices" subtitle="Invoices received from your wholesaler" />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">Total Outstanding Balance</Text>
              <Text
                strong
                style={{
                  fontSize: 18,
                  color: totalOutstanding > 0 ? '#ff4d4f' : '#52c41a',
                }}
              >
                <AmountDisplay amount={totalOutstanding} />
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <ErpTable<PortalInvoice>
        columns={columns}
        dataSource={invoices}
        loading={isLoading}
        rowKey="id"
        pagination={{ total: totalCount, page, pageSize }}
        onPageChange={onPageChange}
      />
    </div>
  )
}
