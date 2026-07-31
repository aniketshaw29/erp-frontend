import { useState } from 'react'
import { Button, Input, Select, Space, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import { getEmployees, getDepartments } from '../../api/modules/hr.api'
import EmployeeFormDrawer from './EmployeeFormDrawer'
import dayjs from 'dayjs'

const { Option } = Select

interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  department: string
  departmentId: string
  designation: string
  dateOfJoining: string
  status: 'ACTIVE' | 'RESIGNED' | 'TERMINATED'
  email: string
  phone?: string
}

const statusColorMap: Record<string, string> = {
  ACTIVE: 'green',
  RESIGNED: 'orange',
  TERMINATED: 'red',
}

export default function EmployeeListPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, statusFilter, departmentFilter],
    queryFn: () =>
      getEmployees({
        search: search || undefined,
        status: statusFilter,
        departmentId: departmentFilter,
      }),
  })

  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  })

  const departments: { id: string; name: string }[] = deptData?.data?.data ?? deptData?.data ?? []

  const employees: Employee[] = data?.data?.data ?? data?.data ?? []

  const handleNewEmployee = () => {
    setEditingEmployee(null)
    setDrawerOpen(true)
  }

  const handleRowClick = (record: Employee) => {
    setEditingEmployee(record)
    setDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditingEmployee(null)
  }

  const columns: ColumnsType<Employee> = [
    {
      title: 'Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 110,
    },
    {
      title: 'Name',
      key: 'name',
      render: (_, r) => `${r.firstName} ${r.lastName}`,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
    },
    {
      title: 'Date of Joining',
      dataIndex: 'dateOfJoining',
      key: 'dateOfJoining',
      render: (v?: string) => (v ? dayjs(v).format('DD MMM YYYY') : '—'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColorMap[status] ?? 'default'}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size={4} onClick={(e) => e.stopPropagation()}>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              setEditingEmployee(record)
              setDrawerOpen(true)
            }}
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              setEditingEmployee(record)
              setDrawerOpen(true)
            }}
          />
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage your workforce"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewEmployee}>
            New Employee
          </Button>
        }
      />

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Search by name or code..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
          allowClear
        />
        <Select
          placeholder="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 140 }}
        >
          <Option value="ACTIVE">Active</Option>
          <Option value="RESIGNED">Resigned</Option>
          <Option value="TERMINATED">Terminated</Option>
        </Select>
        <Select
          placeholder="Department"
          value={departmentFilter}
          onChange={setDepartmentFilter}
          allowClear
          style={{ width: 180 }}
        >
          {departments.map((d) => (
            <Option key={d.id} value={d.id}>
              {d.name}
            </Option>
          ))}
        </Select>
      </Space>

      <ErpTable<Employee>
        columns={columns}
        dataSource={employees}
        loading={isLoading}
        rowKey="id"
        onRowClick={handleRowClick}
      />

      <EmployeeFormDrawer
        open={drawerOpen}
        employee={editingEmployee}
        onClose={handleDrawerClose}
      />
    </div>
  )
}
