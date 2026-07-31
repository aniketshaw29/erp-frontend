import { useState } from 'react'
import type { Key } from 'react'
import {
  Button,
  Tabs,
  Table,
  Space,
  Modal,
  Form,
  Select,
  Input,
  message,
  Typography,
  Tag,
  Tooltip,
} from 'antd'
import {
  CopyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import { getEligibleInvoices, generateIrn, cancelIrn } from '../../api/modules/gst.api'
import { getInvoices } from '../../api/modules/sales.api'

const { Text } = Typography

interface EligibleInvoice {
  id: string
  invoiceNo: string
  customerName: string
  invoiceDate: string
  grandTotal: number
  status: string
  irn?: string
}

interface GeneratedInvoice {
  id: string
  invoiceNo: string
  customerName: string
  irn: string
  ackNo?: string
  irnGeneratedAt?: string
}

const CANCEL_REASONS = [
  { value: '1', label: '1 – Duplicate' },
  { value: '2', label: '2 – Data Entry Mistake' },
  { value: '3', label: '3 – Order Cancelled' },
  { value: '4', label: '4 – Others' },
]

export default function EInvoicePage() {
  const queryClient = useQueryClient()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)
  const [cancelForm] = Form.useForm()

  const { data: eligibleData, isLoading: eligibleLoading } = useQuery({
    queryKey: ['einvoice-eligible'],
    queryFn: () => getEligibleInvoices().then((r) => r.data),
  })

  const { data: generatedData, isLoading: generatedLoading } = useQuery({
    queryKey: ['einvoice-generated'],
    queryFn: () =>
      getInvoices({ size: 200 }).then((r) => {
        const invoices = r.data?.data ?? []
        return invoices.filter((inv: any) => inv.irn) as unknown as GeneratedInvoice[]
      }),
  })

  const generateMutation = useMutation({
    mutationFn: (invoiceId: string) => generateIrn(invoiceId),
    onSuccess: (res, _invoiceId) => {
      const irn = res.data?.data?.irn ?? res.data?.irn ?? ''
      message.success(
        <span>
          IRN generated: <Text code copyable>{irn ? `${irn.slice(0, 20)}…` : 'Success'}</Text>
        </span>,
        6,
      )
      queryClient.invalidateQueries({ queryKey: ['einvoice-eligible'] })
      queryClient.invalidateQueries({ queryKey: ['einvoice-generated'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: () => message.error('Failed to generate IRN'),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string; data: any }) =>
      cancelIrn(invoiceId, data),
    onSuccess: () => {
      message.success('IRN cancelled successfully')
      setCancelModalOpen(false)
      cancelForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['einvoice-generated'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: () => message.error('Failed to cancel IRN'),
  })

  const handleGenerateAll = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Select invoices to generate IRN for')
      return
    }
    const ids = selectedRowKeys as string[]
    ids.forEach((id) => generateMutation.mutate(id))
    setSelectedRowKeys([])
  }

  const openCancelModal = (invoiceId: string) => {
    setCancelTargetId(invoiceId)
    setCancelModalOpen(true)
  }

  const handleCancelConfirm = async () => {
    const values = await cancelForm.validateFields()
    if (!cancelTargetId) return
    cancelMutation.mutate({
      invoiceId: cancelTargetId,
      data: { cancelRsnCode: values.reason, cancelRem: values.remarks },
    })
  }

  const pendingColumns: ColumnsType<EligibleInvoice> = [
    {
      title: 'Invoice No',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      render: (val: string) => <Text strong>{val}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Amount',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      align: 'right',
      render: (amt: number) => <AmountDisplay amount={amt} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color="blue">{s}</Tag>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: EligibleInvoice) => (
        <Button
          size="small"
          type="primary"
          icon={<ThunderboltOutlined />}
          loading={generateMutation.isPending && generateMutation.variables === record.id}
          onClick={() => generateMutation.mutate(record.id)}
        >
          Generate IRN
        </Button>
      ),
    },
  ]

  const generatedColumns: ColumnsType<GeneratedInvoice> = [
    {
      title: 'Invoice No',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      render: (val: string) => <Text strong>{val}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'IRN',
      dataIndex: 'irn',
      key: 'irn',
      render: (irn: string) => (
        <Space>
          <Text code style={{ fontSize: 11 }}>
            {irn ? `${irn.slice(0, 20)}…` : '—'}
          </Text>
          {irn && (
            <Tooltip title="Copy IRN">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(irn)
                  message.success('IRN copied')
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Ack No',
      dataIndex: 'ackNo',
      key: 'ackNo',
      render: (val: string) => val ?? '—',
    },
    {
      title: 'Generated At',
      dataIndex: 'irnGeneratedAt',
      key: 'irnGeneratedAt',
      render: (d: string) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—'),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: GeneratedInvoice) => (
        <Button
          size="small"
          danger
          icon={<CloseCircleOutlined />}
          onClick={() => openCancelModal(record.id)}
        >
          Cancel IRN
        </Button>
      ),
    },
  ]

  const eligible: EligibleInvoice[] = eligibleData?.data ?? eligibleData ?? []
  const generated: GeneratedInvoice[] = generatedData ?? []

  const tabItems = [
    {
      key: 'pending',
      label: (
        <span>
          Pending
          {eligible.length > 0 && (
            <Tag color="orange" style={{ marginLeft: 8 }}>
              {eligible.length}
            </Tag>
          )}
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleGenerateAll}
              disabled={selectedRowKeys.length === 0}
            >
              Generate All ({selectedRowKeys.length})
            </Button>
          </div>
          <Table<EligibleInvoice>
            columns={pendingColumns}
            dataSource={eligible}
            loading={eligibleLoading}
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            scroll={{ x: 'max-content' }}
          />
        </div>
      ),
    },
    {
      key: 'generated',
      label: (
        <span>
          Generated
          {generated.length > 0 && (
            <Tag color="green" style={{ marginLeft: 8 }}>
              {generated.length}
            </Tag>
          )}
        </span>
      ),
      children: (
        <Table<GeneratedInvoice>
          columns={generatedColumns}
          dataSource={generated}
          loading={generatedLoading}
          rowKey="id"
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 'max-content' }}
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="E-Invoice Management"
        subtitle="Generate and manage Invoice Reference Numbers (IRN)"
      />

      <Tabs items={tabItems} />

      <Modal
        title="Cancel IRN"
        open={cancelModalOpen}
        onCancel={() => {
          setCancelModalOpen(false)
          cancelForm.resetFields()
        }}
        onOk={handleCancelConfirm}
        okText="Confirm Cancellation"
        okButtonProps={{ danger: true, loading: cancelMutation.isPending }}
        destroyOnClose
      >
        <Form form={cancelForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Cancellation Reason"
            rules={[{ required: true, message: 'Select a reason' }]}
          >
            <Select options={CANCEL_REASONS} placeholder="Select reason" />
          </Form.Item>
          <Form.Item
            name="remarks"
            label="Remarks"
            rules={[{ required: true, message: 'Enter remarks' }]}
          >
            <Input.TextArea rows={3} placeholder="Describe the reason for cancellation..." maxLength={100} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
