import { useState } from 'react'
import {
  Button,
  Tabs,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Select,
  Card,
  List,
  Typography,
} from 'antd'
import {
  PlayCircleOutlined,
  CheckOutlined,
  DollarOutlined,
  DownloadOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import {
  getPayrollRuns,
  processPayroll,
  approvePayrollRun,
  markPayrollPaid,
  getSalaryStructures,
} from '../../api/modules/hr.api'
import PayrollRunDetailDrawer from './PayrollRunDetailDrawer'
import dayjs from 'dayjs'

const { Option } = Select
const { TabPane } = Tabs
const { Text, Title } = Typography

interface PayrollRun {
  id: string
  month: number
  year: number
  employeeCount: number
  grossTotal: number
  deductions: number
  netTotal: number
  status: 'DRAFT' | 'PROCESSED' | 'APPROVED' | 'PAID'
  processedAt?: string
}

interface SalaryComponent {
  name: string
  type: 'EARNING' | 'DEDUCTION'
  calculationType: 'FIXED' | 'PERCENTAGE'
  value: number
}

interface SalaryStructure {
  id: string
  name: string
  components: SalaryComponent[]
}

const runStatusColors: Record<string, string> = {
  DRAFT: 'default',
  PROCESSED: 'processing',
  APPROVED: 'success',
  PAID: 'green',
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function PayrollPage() {
  const queryClient = useQueryClient()
  const [processModalOpen, setProcessModalOpen] = useState(false)
  const [processMonth, setProcessMonth] = useState<number>(dayjs().month() + 1)
  const [processYear, setProcessYear] = useState<number>(dayjs().year())
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null)

  const { data: runsData, isLoading: runsLoading } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: getPayrollRuns,
  })
  const payrollRuns: PayrollRun[] = runsData?.data?.data ?? runsData?.data ?? []

  const { data: structuresData, isLoading: structuresLoading } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: getSalaryStructures,
  })
  const salaryStructures: SalaryStructure[] = structuresData?.data?.data ?? structuresData?.data ?? []

  const processMutation = useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      processPayroll(month, year),
    onSuccess: () => {
      message.success('Payroll processed successfully')
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] })
      setProcessModalOpen(false)
    },
    onError: () => message.error('Failed to process payroll'),
  })

  const approveMutation = useMutation({
    mutationFn: approvePayrollRun,
    onSuccess: () => {
      message.success('Payroll approved')
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] })
    },
    onError: () => message.error('Failed to approve payroll run'),
  })

  const paidMutation = useMutation({
    mutationFn: markPayrollPaid,
    onSuccess: () => {
      message.success('Payroll marked as paid')
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] })
    },
    onError: () => message.error('Failed to update payroll status'),
  })

  const handleRowClick = (run: PayrollRun) => {
    setSelectedRun(run)
    setDetailDrawerOpen(true)
  }

  const runsColumns: ColumnsType<PayrollRun> = [
    {
      title: 'Period',
      key: 'period',
      render: (_, r) => `${monthNames[r.month - 1]} ${r.year}`,
    },
    {
      title: 'Employees',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      align: 'center',
    },
    {
      title: 'Gross Total',
      dataIndex: 'grossTotal',
      key: 'grossTotal',
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
      title: 'Net Total',
      dataIndex: 'netTotal',
      key: 'netTotal',
      align: 'right',
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={runStatusColors[status] ?? 'default'}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size={4} onClick={(e) => e.stopPropagation()}>
          {record.status === 'PROCESSED' && (
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              style={{ color: '#52c41a' }}
              loading={approveMutation.isPending && approveMutation.variables === record.id}
              onClick={(e) => {
                e.stopPropagation()
                approveMutation.mutate(record.id)
              }}
            >
              Approve
            </Button>
          )}
          {record.status === 'APPROVED' && (
            <>
              <Button
                type="text"
                size="small"
                icon={<DollarOutlined />}
                style={{ color: '#52c41a' }}
                loading={paidMutation.isPending && paidMutation.variables === record.id}
                onClick={(e) => {
                  e.stopPropagation()
                  paidMutation.mutate(record.id)
                }}
              >
                Mark Paid
              </Button>
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedRun(record)
                  setDetailDrawerOpen(true)
                }}
              >
                Payslips
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  const currentYear = dayjs().year()
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1]

  return (
    <div>
      <PageHeader title="Payroll" subtitle="Manage payroll runs and salary structures" />

      <Tabs defaultActiveKey="runs">
        <TabPane tab="Payroll Runs" key="runs">
          <Space style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => setProcessModalOpen(true)}
            >
              Process Payroll
            </Button>
          </Space>

          <ErpTable<PayrollRun>
            columns={runsColumns}
            dataSource={payrollRuns}
            loading={runsLoading}
            rowKey="id"
            onRowClick={handleRowClick}
          />
        </TabPane>

        <TabPane tab="Salary Structures" key="structures">
          <Space style={{ marginBottom: 16 }}>
            <Button icon={<PlusOutlined />} type="primary">
              New Structure
            </Button>
          </Space>

          {structuresLoading ? (
            <Card loading />
          ) : (
            <List
              dataSource={salaryStructures}
              renderItem={(structure) => (
                <Card
                  key={structure.id}
                  title={structure.name}
                  style={{ marginBottom: 16 }}
                  size="small"
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <Title level={5} style={{ marginBottom: 8 }}>
                        Earnings
                      </Title>
                      <List
                        size="small"
                        dataSource={(structure.components ?? []).filter(
                          (c) => c.type === 'EARNING'
                        )}
                        renderItem={(comp) => (
                          <List.Item>
                            <Text>{comp.name}</Text>
                            <Text type="secondary" style={{ marginLeft: 'auto' }}>
                              {comp.calculationType === 'PERCENTAGE'
                                ? `${comp.value}%`
                                : `₹${comp.value.toLocaleString('en-IN')}`}
                            </Text>
                          </List.Item>
                        )}
                        locale={{ emptyText: 'No earnings' }}
                      />
                    </div>
                    <div>
                      <Title level={5} style={{ marginBottom: 8 }}>
                        Deductions
                      </Title>
                      <List
                        size="small"
                        dataSource={(structure.components ?? []).filter(
                          (c) => c.type === 'DEDUCTION'
                        )}
                        renderItem={(comp) => (
                          <List.Item>
                            <Text>{comp.name}</Text>
                            <Text type="secondary" style={{ marginLeft: 'auto' }}>
                              {comp.calculationType === 'PERCENTAGE'
                                ? `${comp.value}%`
                                : `₹${comp.value.toLocaleString('en-IN')}`}
                            </Text>
                          </List.Item>
                        )}
                        locale={{ emptyText: 'No deductions' }}
                      />
                    </div>
                  </div>
                </Card>
              )}
              locale={{ emptyText: 'No salary structures found' }}
            />
          )}
        </TabPane>
      </Tabs>

      {/* Process Payroll Modal */}
      <Modal
        title="Process Payroll"
        open={processModalOpen}
        onCancel={() => setProcessModalOpen(false)}
        onOk={() => processMutation.mutate({ month: processMonth, year: processYear })}
        okText="Process"
        confirmLoading={processMutation.isPending}
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="Month" required>
              <Select
                value={processMonth}
                onChange={setProcessMonth}
                style={{ width: '100%' }}
              >
                {monthNames.map((name, idx) => (
                  <Option key={idx + 1} value={idx + 1}>
                    {name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Year" required>
              <Select
                value={processYear}
                onChange={setProcessYear}
                style={{ width: '100%' }}
              >
                {yearOptions.map((y) => (
                  <Option key={y} value={y}>
                    {y}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Payroll Run Detail Drawer */}
      <PayrollRunDetailDrawer
        open={detailDrawerOpen}
        run={selectedRun}
        onClose={() => {
          setDetailDrawerOpen(false)
          setSelectedRun(null)
        }}
      />
    </div>
  )
}
