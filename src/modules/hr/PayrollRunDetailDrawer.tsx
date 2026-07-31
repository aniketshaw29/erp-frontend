import { Button, Drawer, Space, Tag, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import { getPayslips, getPayslipPdf } from '../../api/modules/hr.api'

interface PayrollRun {
  id: string
  month: number
  year: number
  status: string
}

interface Payslip {
  id: string
  employeeId: string
  employeeCode: string
  employeeName: string
  basic: number
  gross: number
  deductions: number
  net: number
  status: 'GENERATED' | 'PAID'
}

interface PayrollRunDetailDrawerProps {
  open: boolean
  run: PayrollRun | null
  onClose: () => void
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const payslipStatusColors: Record<string, string> = {
  GENERATED: 'processing',
  PAID: 'success',
}

export default function PayrollRunDetailDrawer({
  open,
  run,
  onClose,
}: PayrollRunDetailDrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['payslips', run?.id],
    queryFn: () => getPayslips(run!.id),
    enabled: !!run && open,
  })

  const payslips: Payslip[] = data?.data?.data ?? data?.data ?? []

  const handleDownloadPdf = async (payslipId: string, employeeName: string) => {
    try {
      const response = await getPayslipPdf(payslipId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `payslip-${employeeName.replace(/\s+/g, '_')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      message.error('Failed to download payslip')
    }
  }

  const columns: ColumnsType<Payslip> = [
    { title: 'Code', dataIndex: 'employeeCode', key: 'employeeCode', width: 100 },
    { title: 'Employee', dataIndex: 'employeeName', key: 'employeeName' },
    {
      title: 'Basic',
      dataIndex: 'basic',
      key: 'basic',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
    {
      title: 'Gross',
      dataIndex: 'gross',
      key: 'gross',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
    {
      title: 'Deductions',
      dataIndex: 'deductions',
      key: 'deductions',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
    {
      title: 'Net Pay',
      dataIndex: 'net',
      key: 'net',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={payslipStatusColors[status] ?? 'default'}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Tag>
      ),
    },
    {
      title: 'PDF',
      key: 'pdf',
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<DownloadOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            handleDownloadPdf(record.id, record.employeeName)
          }}
        >
          Download
        </Button>
      ),
    },
  ]

  const title = run
    ? `Payroll — ${monthNames[run.month - 1]} ${run.year}`
    : 'Payroll Run Details'

  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      width={800}
      destroyOnClose
      extra={
        <Space>
          <Tag color={run?.status === 'PAID' ? 'green' : 'processing'}>
            {run?.status ?? ''}
          </Tag>
        </Space>
      }
    >
      <ErpTable<Payslip>
        columns={columns}
        dataSource={payslips}
        loading={isLoading}
        rowKey="id"
      />
    </Drawer>
  )
}
