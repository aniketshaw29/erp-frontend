import { useState } from 'react'
import { Tree, Badge, Card, Empty, Spin } from 'antd'
import type { TreeDataNode } from 'antd'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '../../components/PageHeader'
import EmployeeFormDrawer from './EmployeeFormDrawer'
import { getOrgChart } from '../../api/modules/hr.api'

interface OrgEmployee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  designation?: string
  email: string
  phone?: string
  department?: string
  departmentId?: string
  status?: string
}

interface OrgDepartment {
  id: string
  name: string
  employeeCount: number
  employees: OrgEmployee[]
  subDepartments?: OrgDepartment[]
}

interface OrgChartData {
  departments: OrgDepartment[]
}

function buildTreeData(departments: OrgDepartment[]): TreeDataNode[] {
  return departments.map((dept) => {
    const employeeNodes: TreeDataNode[] = (dept.employees ?? []).map((emp) => ({
      key: `emp-${emp.id}`,
      title: (
        <span>
          {emp.firstName} {emp.lastName}
          {emp.designation && (
            <span style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 8 }}>
              — {emp.designation}
            </span>
          )}
        </span>
      ),
      isLeaf: true,
    }))

    const subDeptNodes: TreeDataNode[] = dept.subDepartments
      ? buildTreeData(dept.subDepartments)
      : []

    return {
      key: `dept-${dept.id}`,
      title: (
        <span>
          <strong>{dept.name}</strong>
          <Badge
            count={dept.employeeCount ?? (dept.employees?.length ?? 0)}
            style={{ marginLeft: 8, backgroundColor: '#1890ff' }}
          />
        </span>
      ),
      children: [...subDeptNodes, ...employeeNodes],
    }
  })
}

export default function OrgChartPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<OrgEmployee | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['org-chart'],
    queryFn: getOrgChart,
  })

  const orgData: OrgChartData = data?.data?.data ?? data?.data ?? { departments: [] }
  const departments: OrgDepartment[] = orgData.departments ?? []

  const treeData = buildTreeData(departments)

  const handleSelect = (
    _selectedKeys: (string | number)[],
    info: { node: { key: string | number } }
  ) => {
    const key = String(info.node.key)
    if (key.startsWith('emp-')) {
      const empId = key.replace('emp-', '')
      // Find employee from flat list
      const allEmployees = departments.flatMap((d) => d.employees ?? [])
      const emp = allEmployees.find((e) => e.id === empId)
      if (emp) {
        setSelectedEmployee(emp)
        setDrawerOpen(true)
      }
    }
  }

  return (
    <div>
      <PageHeader title="Org Chart" subtitle="Organizational structure and hierarchy" />

      <Card>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : treeData.length === 0 ? (
          <Empty description="No organizational data available" />
        ) : (
          <Tree
            treeData={treeData}
            defaultExpandAll
            showLine={{ showLeafIcon: false }}
            showIcon={false}
            onSelect={handleSelect}
            style={{ fontSize: 14 }}
          />
        )}
      </Card>

      <EmployeeFormDrawer
        open={drawerOpen}
        employee={selectedEmployee as any}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedEmployee(null)
        }}
      />
    </div>
  )
}
