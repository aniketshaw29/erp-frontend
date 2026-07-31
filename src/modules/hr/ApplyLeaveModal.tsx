import { useEffect } from 'react'
import { Modal, Form, Select, DatePicker, Input, message, Space, Typography } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { applyLeave, getLeaveTypes, getEmployeeLeaveBalance } from '../../api/modules/hr.api'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

const { Option } = Select
const { Text } = Typography

interface LeaveType {
  id: string
  name: string
  code: string
}

interface LeaveBalance {
  leaveTypeId: string
  leaveTypeName: string
  total: number
  used: number
  remaining: number
}

interface ApplyLeaveModalProps {
  open: boolean
  employeeId: string
  employeeName?: string
  onClose: () => void
}

interface ApplyLeaveFormData {
  leaveTypeId: string
  fromDate: Dayjs | null
  toDate: Dayjs | null
  reason: string
}

export default function ApplyLeaveModal({
  open,
  employeeId,
  employeeName,
  onClose,
}: ApplyLeaveModalProps) {
  const queryClient = useQueryClient()
  const currentYear = dayjs().year()

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ApplyLeaveFormData>({
    defaultValues: {
      leaveTypeId: undefined,
      fromDate: null,
      toDate: null,
      reason: '',
    },
  })

  const fromDate = watch('fromDate')
  const toDate = watch('toDate')
  const selectedLeaveTypeId = watch('leaveTypeId')

  const { data: leaveTypesData } = useQuery({
    queryKey: ['leave-types'],
    queryFn: getLeaveTypes,
  })
  const leaveTypes: LeaveType[] = leaveTypesData?.data?.data ?? leaveTypesData?.data ?? []

  const { data: balanceData } = useQuery({
    queryKey: ['leave-balance', employeeId, currentYear],
    queryFn: () => getEmployeeLeaveBalance(employeeId, currentYear),
    enabled: !!employeeId && open,
  })
  const balances: LeaveBalance[] = balanceData?.data?.data ?? balanceData?.data ?? []

  const selectedBalance = balances.find((b) => b.leaveTypeId === selectedLeaveTypeId)

  const daysRequested =
    fromDate && toDate && !toDate.isBefore(fromDate, 'day')
      ? toDate.diff(fromDate, 'day') + 1
      : 0

  useEffect(() => {
    if (open) {
      reset({
        leaveTypeId: undefined,
        fromDate: null,
        toDate: null,
        reason: '',
      })
    }
  }, [open, reset])

  const mutation = useMutation({
    mutationFn: (data: ApplyLeaveFormData) =>
      applyLeave(employeeId, {
        leaveTypeId: data.leaveTypeId,
        fromDate: data.fromDate?.format('YYYY-MM-DD'),
        toDate: data.toDate?.format('YYYY-MM-DD'),
        reason: data.reason,
      }),
    onSuccess: () => {
      message.success('Leave request submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] })
      onClose()
    },
    onError: () => {
      message.error('Failed to submit leave request')
    },
  })

  const onSubmit = (data: ApplyLeaveFormData) => {
    if (!data.fromDate || !data.toDate) {
      message.error('Please select dates')
      return
    }
    if (data.toDate.isBefore(data.fromDate, 'day')) {
      message.error('To date must be on or after from date')
      return
    }
    if (selectedBalance && daysRequested > selectedBalance.remaining) {
      message.error(`Insufficient leave balance. Available: ${selectedBalance.remaining} days`)
      return
    }
    mutation.mutate(data)
  }

  return (
    <Modal
      title={`Apply Leave${employeeName ? ` — ${employeeName}` : ''}`}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      okText="Submit Request"
      confirmLoading={mutation.isPending}
      destroyOnClose
    >
      <Form layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          label="Leave Type"
          required
          validateStatus={errors.leaveTypeId ? 'error' : undefined}
          help={errors.leaveTypeId?.message}
        >
          <Controller
            name="leaveTypeId"
            control={control}
            rules={{ required: 'Leave type is required' }}
            render={({ field }) => (
              <Select {...field} placeholder="Select leave type" style={{ width: '100%' }}>
                {leaveTypes.map((lt) => {
                  const bal = balances.find((b) => b.leaveTypeId === lt.id)
                  return (
                    <Option key={lt.id} value={lt.id}>
                      {lt.name} {bal ? `(${bal.remaining} days remaining)` : ''}
                    </Option>
                  )
                })}
              </Select>
            )}
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item
            label="From Date"
            required
            validateStatus={errors.fromDate ? 'error' : undefined}
            help={errors.fromDate?.message}
          >
            <Controller
              name="fromDate"
              control={control}
              rules={{ required: 'From date is required' }}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="From"
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="To Date"
            required
            validateStatus={errors.toDate ? 'error' : undefined}
            help={errors.toDate?.message}
          >
            <Controller
              name="toDate"
              control={control}
              rules={{ required: 'To date is required' }}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="To"
                  disabledDate={(d) => (fromDate ? d.isBefore(fromDate, 'day') : false)}
                />
              )}
            />
          </Form.Item>
        </div>

        {daysRequested > 0 && (
          <Space style={{ marginBottom: 12 }}>
            <Text type="secondary">Days requested:</Text>
            <Text strong>{daysRequested} day{daysRequested !== 1 ? 's' : ''}</Text>
            {selectedBalance && (
              <>
                <Text type="secondary">|</Text>
                <Text type="secondary">Balance:</Text>
                <Text
                  strong
                  type={daysRequested > selectedBalance.remaining ? 'danger' : 'success'}
                >
                  {selectedBalance.remaining} days
                </Text>
              </>
            )}
          </Space>
        )}

        <Form.Item
          label="Reason"
          required
          validateStatus={errors.reason ? 'error' : undefined}
          help={errors.reason?.message}
        >
          <Controller
            name="reason"
            control={control}
            rules={{ required: 'Reason is required' }}
            render={({ field }) => (
              <Input.TextArea {...field} rows={3} placeholder="Reason for leave..." />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
