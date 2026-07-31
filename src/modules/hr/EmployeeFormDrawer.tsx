import { useEffect } from 'react'
import {
  Drawer,
  Form,
  Input,
  Button,
  Select,
  Space,
  message,
  Tabs,
  DatePicker,
} from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createEmployee,
  updateEmployee,
  getDepartments,
  getEmployees,
} from '../../api/modules/hr.api'
import dayjs from 'dayjs'

const { Option } = Select
const { TabPane } = Tabs

interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  department?: string
  departmentId?: string
  designation?: string
  managerId?: string
  dateOfJoining?: string
  employmentType?: string
  status?: string
  bankName?: string
  accountNo?: string
  ifsc?: string
  pan?: string
  aadhaar?: string
}

interface EmployeeFormDrawerProps {
  open: boolean
  employee: Employee | null
  onClose: () => void
}

interface EmployeeFormData {
  // Personal
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: any
  address?: string
  city?: string
  state?: string
  pincode?: string
  // Employment
  employeeCode?: string
  dateOfJoining?: any
  departmentId?: string
  designation?: string
  managerId?: string
  employmentType?: string
  status?: string
  // Bank
  bankName?: string
  accountNo?: string
  ifsc?: string
  pan?: string
  aadhaar?: string
}

export default function EmployeeFormDrawer({ open, employee, onClose }: EmployeeFormDrawerProps) {
  const queryClient = useQueryClient()
  const isEdit = employee !== null

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: null,
      address: '',
      city: '',
      state: '',
      pincode: '',
      employeeCode: '',
      dateOfJoining: null,
      departmentId: undefined,
      designation: '',
      managerId: undefined,
      employmentType: undefined,
      status: 'ACTIVE',
      bankName: '',
      accountNo: '',
      ifsc: '',
      pan: '',
      aadhaar: '',
    },
  })

  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  })

  const { data: empData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployees({ status: 'ACTIVE' }),
  })

  const departments: { id: string; name: string }[] = deptData?.data?.data ?? deptData?.data ?? []
  const allEmployees: Employee[] = empData?.data?.data ?? empData?.data ?? []

  useEffect(() => {
    if (open) {
      if (employee) {
        reset({
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone ?? '',
          dateOfBirth: employee.dateOfBirth ? dayjs(employee.dateOfBirth) : null,
          address: employee.address ?? '',
          city: employee.city ?? '',
          state: employee.state ?? '',
          pincode: employee.pincode ?? '',
          employeeCode: employee.employeeCode,
          dateOfJoining: employee.dateOfJoining ? dayjs(employee.dateOfJoining) : null,
          departmentId: employee.departmentId,
          designation: employee.designation ?? '',
          managerId: employee.managerId,
          employmentType: employee.employmentType,
          status: employee.status ?? 'ACTIVE',
          bankName: employee.bankName ?? '',
          accountNo: employee.accountNo ?? '',
          ifsc: employee.ifsc ?? '',
          pan: employee.pan ?? '',
          aadhaar: employee.aadhaar ?? '',
        })
      } else {
        reset({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          dateOfBirth: null,
          address: '',
          city: '',
          state: '',
          pincode: '',
          employeeCode: '',
          dateOfJoining: null,
          departmentId: undefined,
          designation: '',
          managerId: undefined,
          employmentType: undefined,
          status: 'ACTIVE',
          bankName: '',
          accountNo: '',
          ifsc: '',
          pan: '',
          aadhaar: '',
        })
      }
    }
  }, [open, employee, reset])

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      message.success('Employee created successfully')
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      onClose()
    },
    onError: () => {
      message.error('Failed to create employee')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateEmployee(id, data),
    onSuccess: () => {
      message.success('Employee updated successfully')
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      onClose()
    },
    onError: () => {
      message.error('Failed to update employee')
    },
  })

  const onSubmit = (data: EmployeeFormData) => {
    const payload = {
      ...data,
      dateOfBirth: data.dateOfBirth ? data.dateOfBirth.format('YYYY-MM-DD') : undefined,
      dateOfJoining: data.dateOfJoining ? data.dateOfJoining.format('YYYY-MM-DD') : undefined,
    }
    if (isEdit && employee) {
      updateMutation.mutate({ id: employee.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const loading = createMutation.isPending || updateMutation.isPending

  // Mask aadhaar display
  const maskAadhaar = (val: string) => {
    if (!val) return ''
    if (val.length <= 4) return val
    return 'XXXX XXXX ' + val.slice(-4)
  }

  return (
    <Drawer
      title={isEdit ? 'Edit Employee' : 'New Employee'}
      open={open}
      onClose={onClose}
      width={700}
      destroyOnClose
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={handleSubmit(onSubmit)} loading={loading}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </Space>
        </div>
      }
    >
      <Form layout="vertical">
        <Tabs defaultActiveKey="personal">
          <TabPane tab="Personal" key="personal">
            <Space style={{ width: '100%' }} direction="vertical" size={0}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item
                  label="First Name"
                  required
                  validateStatus={errors.firstName ? 'error' : undefined}
                  help={errors.firstName?.message}
                >
                  <Controller
                    name="firstName"
                    control={control}
                    rules={{ required: 'First name is required' }}
                    render={({ field }) => <Input {...field} placeholder="First name" />}
                  />
                </Form.Item>
                <Form.Item
                  label="Last Name"
                  required
                  validateStatus={errors.lastName ? 'error' : undefined}
                  help={errors.lastName?.message}
                >
                  <Controller
                    name="lastName"
                    control={control}
                    rules={{ required: 'Last name is required' }}
                    render={({ field }) => <Input {...field} placeholder="Last name" />}
                  />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item
                  label="Email"
                  required
                  validateStatus={errors.email ? 'error' : undefined}
                  help={errors.email?.message}
                >
                  <Controller
                    name="email"
                    control={control}
                    rules={{ required: 'Email is required' }}
                    render={({ field }) => <Input {...field} type="email" placeholder="email@company.com" />}
                  />
                </Form.Item>
                <Form.Item label="Phone">
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="+91 98765 43210" />}
                  />
                </Form.Item>
              </div>

              <Form.Item label="Date of Birth">
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                      placeholder="DD/MM/YYYY"
                    />
                  )}
                />
              </Form.Item>

              <Form.Item label="Address">
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => <Input.TextArea {...field} rows={2} placeholder="Street address" />}
                />
              </Form.Item>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <Form.Item label="City">
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="City" />}
                  />
                </Form.Item>
                <Form.Item label="State">
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="State" />}
                  />
                </Form.Item>
                <Form.Item label="Pincode">
                  <Controller
                    name="pincode"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Pincode" />}
                  />
                </Form.Item>
              </div>
            </Space>
          </TabPane>

          <TabPane tab="Employment" key="employment">
            <Space style={{ width: '100%' }} direction="vertical" size={0}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item label={isEdit ? 'Employee Code' : 'Employee Code (auto-generated)'}>
                  <Controller
                    name="employeeCode"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder={isEdit ? employee?.employeeCode : 'Auto-generated'}
                        disabled={!isEdit}
                      />
                    )}
                  />
                </Form.Item>
                <Form.Item label="Date of Joining">
                  <Controller
                    name="dateOfJoining"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        {...field}
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                        placeholder="DD/MM/YYYY"
                      />
                    )}
                  />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item label="Department">
                  <Controller
                    name="departmentId"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} placeholder="Select department" style={{ width: '100%' }} allowClear>
                        {departments.map((d) => (
                          <Option key={d.id} value={d.id}>
                            {d.name}
                          </Option>
                        ))}
                      </Select>
                    )}
                  />
                </Form.Item>
                <Form.Item label="Designation">
                  <Controller
                    name="designation"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="e.g. Software Engineer" />}
                  />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item label="Manager">
                  <Controller
                    name="managerId"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} placeholder="Select manager" style={{ width: '100%' }} allowClear showSearch optionFilterProp="children">
                        {allEmployees
                          .filter((e) => !isEdit || e.id !== employee?.id)
                          .map((e) => (
                            <Option key={e.id} value={e.id}>
                              {e.firstName} {e.lastName}
                            </Option>
                          ))}
                      </Select>
                    )}
                  />
                </Form.Item>
                <Form.Item label="Employment Type">
                  <Controller
                    name="employmentType"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} placeholder="Select type" style={{ width: '100%' }} allowClear>
                        <Option value="FULL_TIME">Full Time</Option>
                        <Option value="PART_TIME">Part Time</Option>
                        <Option value="CONTRACT">Contract</Option>
                        <Option value="INTERN">Intern</Option>
                      </Select>
                    )}
                  />
                </Form.Item>
              </div>

              <Form.Item label="Status">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} style={{ width: '100%' }}>
                      <Option value="ACTIVE">Active</Option>
                      <Option value="RESIGNED">Resigned</Option>
                      <Option value="TERMINATED">Terminated</Option>
                    </Select>
                  )}
                />
              </Form.Item>
            </Space>
          </TabPane>

          <TabPane tab="Bank Details" key="bank">
            <Space style={{ width: '100%' }} direction="vertical" size={0}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item label="Bank Name">
                  <Controller
                    name="bankName"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="e.g. HDFC Bank" />}
                  />
                </Form.Item>
                <Form.Item label="Account Number">
                  <Controller
                    name="accountNo"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Account number" />}
                  />
                </Form.Item>
              </div>

              <Form.Item label="IFSC Code">
                <Controller
                  name="ifsc"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g. HDFC0001234"
                      style={{ textTransform: 'uppercase' }}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
              </Form.Item>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item label="PAN">
                  <Controller
                    name="pan"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="AAAAA0000A"
                        style={{ textTransform: 'uppercase' }}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    )}
                  />
                </Form.Item>
                <Form.Item
                  label="Aadhaar"
                  help={isEdit && employee?.aadhaar ? `Stored: ${maskAadhaar(employee.aadhaar)}` : undefined}
                >
                  <Controller
                    name="aadhaar"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="12-digit Aadhaar number"
                        maxLength={12}
                      />
                    )}
                  />
                </Form.Item>
              </div>
            </Space>
          </TabPane>
        </Tabs>
      </Form>
    </Drawer>
  )
}
