import { useState } from 'react'
import {
  Button,
  Tabs,
  Select,
  Space,
  Tag,
  message,
  Modal,
  Input,
  Form,
} from 'antd'
import { CheckOutlined, CloseOutlined, UserAddOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import ApplyLeaveModal from './ApplyLeaveModal'
import {
  getLeaveRequests,
  approveLeave,
  rejectLeave,
  getEmployees,
  getEmployeeLeaveBalance,
} from '../../api/modules/hr.api'
import dayjs from 'dayjs'

const { Option } = Select
const { TabPane } = Tabs

interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  employeeCode: string
  leaveType: string
  leaveTypeId: string
  fromDate: string
  toDate: string
  days: number
  reason?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

interface LeaveBalanceRow {
  employeeId: string
  employeeName: string
  employeeCode: string
  casualLeaveUsed: number
  casualLeaveTotal: number
  sickLeaveUsed: number
  sickLeaveTotal: number
  earnedLeaveUsed: number
  earnedLeaveTotal: number
  totalRemaining: number
}

const statusColors: Record<string, string> = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
}

export default function LeaveManagementPage() {
  const queryClient = useQueryClient()
  const currentYear = dayjs().year()

  const [statusFilter, setStatusFilter] = useState<string | undefined>('PENDING')
  const [balanceYear, setBalanceYear] = useState<number>(currentYear)
  const [balanceEmployee, setBalanceEmployee] = useState<string | undefined>()
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const [applyLeaveOpen, setApplyLeaveOpen] = useState(false)
  const [applyLeaveEmployeeId, setApplyLeaveEmployeeId] = useState<string>('')
  const [applyLeaveEmployeeName, setApplyLeaveEmployeeName] = useState<string>('')

  const { data: leaveData, isLoading: leaveLoading } = useQuery({
    queryKey: ['leave-requests', statusFilter],
    queryFn: () => getLeaveRequests({ status: statusFilter }),
  })

  const leaveRequests: LeaveRequest[] = leaveData?.data?.data ?? leaveData?.data ?? []

  const { data: empData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployees({ status: 'ACTIVE' }),
  })
  const employees: { id: string; firstName: string; lastName: string; employeeCode: string }[] =
    empData?.data?.data ?? empData?.data ?? []

  // For leave balances tab, fetch all employees' balance or one specific employee
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['leave-balance-all', balanceEmployee, balanceYear],
    queryFn: () =>
      balanceEmployee
        ? getEmployeeLeaveBalance(balanceEmployee, balanceYear)
        : getLeaveRequests({ year: balanceYear, view: 'balance' }),
  })

  const balanceRows: LeaveBalanceRow[] = balanceData?.data?.data ?? balanceData?.data ?? []

  const approveMutation = useMutation({
    mutationFn: approveLeave,
    onSuccess: () => {
      message.success('Leave approved')
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
    onError: () => message.error('Failed to approve leave'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectLeave(id, reason),
    onSuccess: () => {
      message.success('Leave rejected')
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      setRejectModalOpen(false)
      setRejectReason('')
      setRejectingRequestId(null)
    },
    onError: () => message.error('Failed to reject leave'),
  })

  const handleRejectOpen = (requestId: string) => {
    setRejectingRequestId(requestId)
    setRejectModalOpen(true)
  }

  const handleRejectConfirm = () => {
    if (!rejectingRequestId) return
    if (!rejectReason.trim()) {
      message.error('Please provide a reason for rejection')
      return
    }
    rejectMutation.mutate({ id: rejectingRequestId, reason: rejectReason })
  }

  const handleApplyLeave = (employeeId: string, name: string) => {
    setApplyLeaveEmployeeId(employeeId)
    setApplyLeaveEmployeeName(name)
    setApplyLeaveOpen(true)
  }

  const leaveColumns: ColumnsType<LeaveRequest> = [
    { title: 'Employee', dataIndex: 'employeeName', key: 'employeeName' },
    { title: 'Leave Type', dataIndex: 'leaveType', key: 'leaveType' },
    {
      title: 'From',
      dataIndex: 'fromDate',
      key: 'fromDate',
      render: (v: string) => dayjs(v).format('DD MMM YYYY'),
    },
    {
      title: 'To',
      dataIndex: 'toDate',
      key: 'toDate',
      render: (v: string) => dayjs(v).format('DD MMM YYYY'),
    },
    { title: 'Days', dataIndex: 'days', key: 'days', width: 70 },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (v?: string) => v || '—',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] ?? 'default'}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) =>
        record.status === 'PENDING' ? (
          <Space size={4} onClick={(e) => e.stopPropagation()}>
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
            <Button
              type="text"
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleRejectOpen(record.id)
              }}
            >
              Reject
            </Button>
          </Space>
        ) : null,
    },
  ]

  const balanceColumns: ColumnsType<LeaveBalanceRow> = [
    { title: 'Code', dataIndex: 'employeeCode', key: 'employeeCode', width: 100 },
    { title: 'Employee', dataIndex: 'employeeName', key: 'employeeName' },
    {
      title: 'Casual Leave',
      key: 'casual',
      align: 'center',
      render: (_, r) => `${r.casualLeaveUsed ?? 0}/${r.casualLeaveTotal ?? 0}`,
    },
    {
      title: 'Sick Leave',
      key: 'sick',
      align: 'center',
      render: (_, r) => `${r.sickLeaveUsed ?? 0}/${r.sickLeaveTotal ?? 0}`,
    },
    {
      title: 'Earned Leave',
      key: 'earned',
      align: 'center',
      render: (_, r) => `${r.earnedLeaveUsed ?? 0}/${r.earnedLeaveTotal ?? 0}`,
    },
    {
      title: 'Total Remaining',
      dataIndex: 'totalRemaining',
      key: 'totalRemaining',
      align: 'center',
      render: (v: number) => <Tag color="blue">{v ?? 0} days</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          size="small"
          icon={<UserAddOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            handleApplyLeave(record.employeeId, record.employeeName)
          }}
        >
          Apply Leave
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Leave Management" subtitle="Manage leave requests and balances" />

      <Tabs defaultActiveKey="approvals">
        <TabPane tab="Pending Approvals" key="approvals">
          <Space style={{ marginBottom: 16 }} wrap>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              placeholder="Filter by status"
              allowClear
            >
              <Option value="PENDING">Pending</Option>
              <Option value="APPROVED">Approved</Option>
              <Option value="REJECTED">Rejected</Option>
            </Select>
          </Space>

          <ErpTable<LeaveRequest>
            columns={leaveColumns}
            dataSource={leaveRequests}
            loading={leaveLoading}
            rowKey="id"
          />
        </TabPane>

        <TabPane tab="Leave Balances" key="balances">
          <Space style={{ marginBottom: 16 }} wrap>
            <Select
              placeholder="Year"
              value={balanceYear}
              onChange={setBalanceYear}
              style={{ width: 100 }}
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <Option key={y} value={y}>
                  {y}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Filter by employee"
              value={balanceEmployee}
              onChange={setBalanceEmployee}
              allowClear
              style={{ width: 220 }}
              showSearch
              optionFilterProp="children"
            >
              {employees.map((e) => (
                <Option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                </Option>
              ))}
            </Select>
          </Space>

          <ErpTable<LeaveBalanceRow>
            columns={balanceColumns}
            dataSource={Array.isArray(balanceRows) ? balanceRows : []}
            loading={balanceLoading}
            rowKey="employeeId"
          />
        </TabPane>
      </Tabs>

      {/* Reject Reason Modal */}
      <Modal
        title="Reject Leave Request"
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false)
          setRejectReason('')
          setRejectingRequestId(null)
        }}
        onOk={handleRejectConfirm}
        okText="Reject"
        okButtonProps={{ danger: true }}
        confirmLoading={rejectMutation.isPending}
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Reason for rejection" required>
            <Input.TextArea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide a reason..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        open={applyLeaveOpen}
        employeeId={applyLeaveEmployeeId}
        employeeName={applyLeaveEmployeeName}
        onClose={() => setApplyLeaveOpen(false)}
      />
    </div>
  )
}
