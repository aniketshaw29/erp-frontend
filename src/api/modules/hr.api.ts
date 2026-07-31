import client from '../client'

// Employees
export const getEmployees = (params?: any) => client.get('/api/v1/hr/employees', { params })
export const getEmployee = (id: string) => client.get(`/api/v1/hr/employees/${id}`)
export const createEmployee = (data: any) => client.post('/api/v1/hr/employees', data)
export const updateEmployee = (id: string, data: any) => client.put(`/api/v1/hr/employees/${id}`, data)
export const deleteEmployee = (id: string) => client.delete(`/api/v1/hr/employees/${id}`)
export const getOrgChart = () => client.get('/api/v1/hr/org-chart')

// Attendance
export const getDailyRoster = (date: string) => client.get('/api/v1/hr/attendance/daily', { params: { date } })
export const markAttendance = (data: any) => client.post('/api/v1/hr/attendance', data)
export const bulkMarkAttendance = (data: any) => client.post('/api/v1/hr/attendance/bulk', data)
export const getAttendance = (employeeId: string, params?: any) => client.get(`/api/v1/hr/employees/${employeeId}/attendance`, { params })
export const getAttendanceSummary = (employeeId: string, month: number, year: number) => client.get(`/api/v1/hr/attendance/summary/${employeeId}`, { params: { month, year } })

// Leave
export const getLeaveRequests = (params?: any) => client.get('/api/v1/hr/leave-requests', { params })
export const getEmployeeLeaveBalance = (employeeId: string, year: number) => client.get(`/api/v1/hr/employees/${employeeId}/leave-balance`, { params: { year } })
export const applyLeave = (employeeId: string, data: any) => client.post(`/api/v1/hr/employees/${employeeId}/leave-requests`, data)
export const approveLeave = (requestId: string) => client.post(`/api/v1/hr/leave-requests/${requestId}/approve`)
export const rejectLeave = (requestId: string, reason: string) => client.post(`/api/v1/hr/leave-requests/${requestId}/reject`, { reason })

// Departments
export const getDepartments = () => client.get('/api/v1/hr/departments')
export const createDepartment = (data: any) => client.post('/api/v1/hr/departments', data)
export const getLeaveTypes = () => client.get('/api/v1/hr/leave-types')

// Payroll
export const getPayrollRuns = () => client.get('/api/v1/payroll/runs')
export const processPayroll = (month: number, year: number) => client.post('/api/v1/payroll/process', null, { params: { month, year } })
export const approvePayrollRun = (runId: string) => client.post(`/api/v1/payroll/runs/${runId}/approve`)
export const markPayrollPaid = (runId: string) => client.post(`/api/v1/payroll/runs/${runId}/paid`)
export const getPayslips = (runId: string) => client.get(`/api/v1/payroll/runs/${runId}/payslips`)
export const getPayslipPdf = (payslipId: string) => client.get(`/api/v1/payroll/payslips/${payslipId}/pdf`, { responseType: 'blob' })
export const getEmployeePayslips = (employeeId: string, year?: number) => client.get(`/api/v1/payroll/employees/${employeeId}/payslips`, { params: { year } })
export const getSalaryStructures = () => client.get('/api/v1/payroll/salary-structures')
export const assignSalary = (employeeId: string, data: any) => client.post(`/api/v1/payroll/employees/${employeeId}/salary`, data)
