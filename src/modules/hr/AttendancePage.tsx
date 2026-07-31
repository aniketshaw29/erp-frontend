import { useState } from 'react'
import {
  Button,
  Tabs,
  DatePicker,
  Select,
  Space,
  Tag,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
  Calendar,
} from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import {
  getDailyRoster,
  bulkMarkAttendance,
  markAttendance,
  getAttendanceSummary,
  getEmployees,
} from '../../api/modules/hr.api'
import dayjs from 'dayjs'
import type { Dayjs as DayjsType } from 'dayjs'

const { Option } = Select
const { TabPane } = Tabs

interface RosterEntry {
  id: string
  employeeId: string
  employeeCode: string
  employeeName: string
  department: string
  checkIn?: string
  checkOut?: string
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HALF_DAY' | 'HOLIDAY'
  workHours?: number
}

interface AttendanceDay {
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HALF_DAY' | 'HOLIDAY' | 'WEEKEND'
}

const attendanceStatusColors: Record<string, string> = {
  PRESENT: 'green',
  ABSENT: 'red',
  LEAVE: 'blue',
  HALF_DAY: 'orange',
  HOLIDAY: 'purple',
  WEEKEND: 'default',
}

const attendanceCellColors: Record<string, string> = {
  PRESENT: '#52c41a',
  ABSENT: '#ff4d4f',
  LEAVE: '#1890ff',
  HALF_DAY: '#fa8c16',
  HOLIDAY: '#722ed1',
  WEEKEND: '#d9d9d9',
}

export default function AttendancePage() {
  const queryClient = useQueryClient()

  // Daily Roster state
  const [rosterDate, setRosterDate] = useState<DayjsType>(dayjs())
  const [rosterLoaded, setRosterLoaded] = useState(false)

  // Employee History state
  const [selectedEmployee, setSelectedEmployee] = useState<string | undefined>()
  const [historyMonth, setHistoryMonth] = useState<DayjsType>(dayjs())

  const { data: empData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployees({ status: 'ACTIVE' }),
  })
  const employees: { id: string; firstName: string; lastName: string; employeeCode: string }[] =
    empData?.data?.data ?? empData?.data ?? []

  const {
    data: rosterData,
    isLoading: rosterLoading,
  } = useQuery({
    queryKey: ['daily-roster', rosterDate.format('YYYY-MM-DD')],
    queryFn: () => getDailyRoster(rosterDate.format('YYYY-MM-DD')),
    enabled: rosterLoaded,
  })

  const rosterEntries: RosterEntry[] = rosterData?.data?.data ?? rosterData?.data ?? []

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['attendance-summary', selectedEmployee, historyMonth.month() + 1, historyMonth.year()],
    queryFn: () =>
      getAttendanceSummary(
        selectedEmployee!,
        historyMonth.month() + 1,
        historyMonth.year()
      ),
    enabled: !!selectedEmployee,
  })

  const summary = summaryData?.data?.data ?? summaryData?.data
  const attendanceDays: AttendanceDay[] = summary?.days ?? []

  const bulkMarkMutation = useMutation({
    mutationFn: bulkMarkAttendance,
    onSuccess: () => {
      message.success('All employees marked as present')
      queryClient.invalidateQueries({ queryKey: ['daily-roster'] })
    },
    onError: () => message.error('Failed to mark attendance'),
  })

  const markMutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: () => {
      message.success('Attendance updated')
      queryClient.invalidateQueries({ queryKey: ['daily-roster'] })
    },
    onError: () => message.error('Failed to update attendance'),
  })

  const handleLoadRoster = () => {
    setRosterLoaded(true)
  }

  const handleBulkPresent = () => {
    bulkMarkMutation.mutate({
      date: rosterDate.format('YYYY-MM-DD'),
      status: 'PRESENT',
    })
  }

  const handleStatusChange = (employeeId: string, status: string) => {
    markMutation.mutate({
      employeeId,
      date: rosterDate.format('YYYY-MM-DD'),
      status,
    })
  }

  const rosterColumns: ColumnsType<RosterEntry> = [
    { title: 'Code', dataIndex: 'employeeCode', key: 'employeeCode', width: 100 },
    { title: 'Employee', dataIndex: 'employeeName', key: 'employeeName' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (v?: string) => v || '—',
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (v?: string) => v || '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={attendanceStatusColors[status] ?? 'default'}>
          {status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Work Hours',
      dataIndex: 'workHours',
      key: 'workHours',
      render: (v?: number) => (v != null ? `${v.toFixed(1)}h` : '—'),
    },
    {
      title: 'Mark',
      key: 'mark',
      render: (_, record) => (
        <Select
          size="small"
          value={record.status}
          style={{ width: 120 }}
          onChange={(val) => handleStatusChange(record.employeeId, val)}
          onClick={(e) => e.stopPropagation()}
        >
          <Option value="PRESENT">Present</Option>
          <Option value="ABSENT">Absent</Option>
          <Option value="HALF_DAY">Half Day</Option>
          <Option value="LEAVE">Leave</Option>
          <Option value="HOLIDAY">Holiday</Option>
        </Select>
      ),
    },
  ]

  const dateCellRender = (date: DayjsType) => {
    const dayData = attendanceDays.find(
      (d) => dayjs(d.date).isSame(date, 'day')
    )
    if (!dayData) return null
    return (
      <Tooltip title={dayData.status.replace('_', ' ')}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: attendanceCellColors[dayData.status] ?? '#d9d9d9',
            margin: '0 auto',
          }}
        />
      </Tooltip>
    )
  }

  const presentCount = attendanceDays.filter((d) => d.status === 'PRESENT').length
  const absentCount = attendanceDays.filter((d) => d.status === 'ABSENT').length
  const leaveCount = attendanceDays.filter((d) => d.status === 'LEAVE').length
  const halfDayCount = attendanceDays.filter((d) => d.status === 'HALF_DAY').length
  const workHours = summary?.totalWorkHours ?? 0

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Track and manage employee attendance" />

      <Tabs defaultActiveKey="roster">
        <TabPane tab="Daily Roster" key="roster">
          <Space style={{ marginBottom: 16 }} wrap>
            <DatePicker
              value={rosterDate}
              onChange={(v) => v && setRosterDate(v)}
              format="DD MMM YYYY"
              allowClear={false}
            />
            <Button type="primary" onClick={handleLoadRoster} loading={rosterLoading}>
              Load
            </Button>
            {rosterLoaded && rosterEntries.length > 0 && (
              <Button
                icon={<CheckCircleOutlined />}
                onClick={handleBulkPresent}
                loading={bulkMarkMutation.isPending}
              >
                Mark All Present
              </Button>
            )}
          </Space>

          {rosterLoaded && (
            <ErpTable<RosterEntry>
              columns={rosterColumns}
              dataSource={rosterEntries}
              loading={rosterLoading}
              rowKey="employeeId"
            />
          )}
        </TabPane>

        <TabPane tab="Employee History" key="history">
          <Space style={{ marginBottom: 16 }} wrap>
            <Select
              placeholder="Select employee"
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              style={{ width: 240 }}
              showSearch
              optionFilterProp="children"
              allowClear
            >
              {employees.map((e) => (
                <Option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeCode})
                </Option>
              ))}
            </Select>
            <DatePicker
              picker="month"
              value={historyMonth}
              onChange={(v) => v && setHistoryMonth(v)}
              format="MMM YYYY"
              allowClear={false}
            />
          </Space>

          {selectedEmployee && (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={4}>
                  <Card size="small">
                    <Statistic
                      title="Present"
                      value={presentCount}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col span={4}>
                  <Card size="small">
                    <Statistic
                      title="Absent"
                      value={absentCount}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Card>
                </Col>
                <Col span={4}>
                  <Card size="small">
                    <Statistic
                      title="On Leave"
                      value={leaveCount}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={4}>
                  <Card size="small">
                    <Statistic
                      title="Half Day"
                      value={halfDayCount}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Card>
                </Col>
                <Col span={4}>
                  <Card size="small">
                    <Statistic
                      title="Work Hours"
                      value={workHours.toFixed(1)}
                      suffix="h"
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Card>
                </Col>
              </Row>

              <Card loading={summaryLoading}>
                <Calendar
                  value={historyMonth}
                  onPanelChange={(v) => setHistoryMonth(v)}
                  cellRender={(date, info) => {
                    if (info.type === 'date') {
                      return dateCellRender(date)
                    }
                    return null
                  }}
                  fullscreen={false}
                />
                <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {Object.entries(attendanceCellColors).map(([status, color]) => (
                    <Space key={status} size={4}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: color,
                        }}
                      />
                      <span style={{ fontSize: 12 }}>{status.replace('_', ' ')}</span>
                    </Space>
                  ))}
                </div>
              </Card>
            </>
          )}
        </TabPane>
      </Tabs>
    </div>
  )
}
