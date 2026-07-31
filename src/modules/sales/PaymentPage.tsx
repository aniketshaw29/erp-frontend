import { useState, useEffect } from 'react'
import {
  Form,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Typography,
  Table,
  Card,
  Input,
  message,
  Row,
  Col,
  Checkbox,
  Divider,
} from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import { getParties } from '../../api/modules/party.api'
import { getInvoices, receivePayment } from '../../api/modules/sales.api'
import type { Invoice, PaymentAllocation } from '../../types/sales.types'

const { Title, Text } = Typography

const PAYMENT_MODES = ['CASH', 'BANK', 'UPI', 'CHEQUE', 'NEFT', 'RTGS'] as const

export default function PaymentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [customerId, setCustomerId] = useState<string | undefined>(undefined)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([])
  const [paymentAmount, setPaymentAmount] = useState<number>(0)

  // ── Data queries ──────────────────────────────────────────────────────────

  const { data: partiesData } = useQuery({
    queryKey: ['parties-customers'],
    queryFn: () => getParties({ size: 200, partyType: 'CUSTOMER' }).then((r) => r.data),
  })

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['outstanding-invoices', customerId],
    queryFn: () =>
      getInvoices({
        customerId,
        size: 100,
        status: 'SUBMITTED',
      }).then((r) => r.data),
    enabled: true, // show all outstanding even if no customer selected
  })

  const outstandingInvoices = (invoicesData?.data ?? []).filter(
    (inv) =>
      (inv.status === 'SUBMITTED' || inv.status === 'PARTIAL') &&
      inv.outstandingAmount > 0,
  )

  // ── Auto-calc payment amount from selection ───────────────────────────────

  useEffect(() => {
    const total = outstandingInvoices
      .filter((inv) => selectedInvoiceIds.includes(inv.id))
      .reduce((sum, inv) => sum + inv.outstandingAmount, 0)
    setPaymentAmount(parseFloat(total.toFixed(2)))
    form.setFieldValue('amount', parseFloat(total.toFixed(2)))
  }, [selectedInvoiceIds, outstandingInvoices, form])

  // ── Selection helpers ─────────────────────────────────────────────────────

  const toggleInvoice = (id: string, checked: boolean) => {
    setSelectedInvoiceIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    )
  }

  const toggleAll = (e: CheckboxChangeEvent) => {
    setSelectedInvoiceIds(e.target.checked ? outstandingInvoices.map((i) => i.id) : [])
  }

  const allSelected =
    outstandingInvoices.length > 0 &&
    outstandingInvoices.every((i) => selectedInvoiceIds.includes(i.id))
  const someSelected =
    selectedInvoiceIds.length > 0 && !allSelected

  // ── Mutation ──────────────────────────────────────────────────────────────

  const submitMutation = useMutation({
    mutationFn: (payload: any) => receivePayment(payload),
    onSuccess: () => {
      message.success('Payment recorded')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['outstanding-invoices'] })
      navigate('/sales/invoices')
    },
    onError: () => message.error('Failed to record payment'),
  })

  const handleSubmit = async () => {
    const values = await form.validateFields()

    if (selectedInvoiceIds.length === 0) {
      message.warning('Select at least one invoice to allocate payment')
      return
    }

    const allocations: PaymentAllocation[] = outstandingInvoices
      .filter((inv) => selectedInvoiceIds.includes(inv.id))
      .map((inv) => ({
        invoiceId: inv.id,
        invoiceNo: inv.invoiceNo,
        amount: inv.outstandingAmount,
      }))

    const customer = partiesData?.data?.find((p) => p.id === values.customerId)

    submitMutation.mutate({
      customerId: values.customerId,
      customerName: customer?.name ?? '',
      paymentDate: values.paymentDate.format('YYYY-MM-DD'),
      amount: values.amount,
      mode: values.mode,
      reference: values.reference,
      notes: values.notes,
      allocations,
    })
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: ColumnsType<Invoice> = [
    {
      title: (
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={toggleAll}
        />
      ),
      key: 'select',
      width: 48,
      render: (_: unknown, record: Invoice) => (
        <Checkbox
          checked={selectedInvoiceIds.includes(record.id)}
          onChange={(e) => toggleInvoice(record.id, e.target.checked)}
        />
      ),
    },
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
      title: 'Grand Total',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      align: 'right',
      render: (amt: number) => <AmountDisplay amount={amt} />,
    },
    {
      title: 'Outstanding',
      dataIndex: 'outstandingAmount',
      key: 'outstandingAmount',
      align: 'right',
      render: (amt: number) => (
        <Text style={{ color: '#cf1322' }}>
          <AmountDisplay amount={amt} />
        </Text>
      ),
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Receive Payment"
        subtitle="Record customer payment and allocate to invoices"
        actions={
          <Space>
            <Button onClick={() => navigate('/sales/invoices')}>Cancel</Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={submitMutation.isPending}
            >
              Record Payment
            </Button>
          </Space>
        }
      />

      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="customerId"
              label="Customer"
              rules={[{ required: true, message: 'Select a customer' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Filter by customer"
                optionFilterProp="label"
                options={partiesData?.data?.map((p) => ({ value: p.id, label: p.name }))}
                onChange={(val) => {
                  setCustomerId(val)
                  setSelectedInvoiceIds([])
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={5}>
            <Form.Item
              name="paymentDate"
              label="Payment Date"
              rules={[{ required: true, message: 'Select payment date' }]}
              initialValue={dayjs()}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={5}>
            <Form.Item
              name="mode"
              label="Payment Mode"
              rules={[{ required: true, message: 'Select payment mode' }]}
            >
              <Select
                placeholder="Select mode"
                options={PAYMENT_MODES.map((m) => ({ value: m, label: m }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="reference" label="Reference No">
              <Input placeholder="Cheque / UTR / transaction ref" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Outstanding Invoices</Divider>

        <Table<Invoice>
          dataSource={outstandingInvoices}
          columns={columns}
          rowKey="id"
          loading={invoicesLoading}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No outstanding invoices' }}
        />

        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col xs={24} sm={14}>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={3} placeholder="Payment notes..." />
            </Form.Item>
          </Col>
          <Col xs={24} sm={10}>
            <Card size="small">
              <Title level={5} style={{ marginTop: 0 }}>
                Payment Summary
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Invoices Selected</Text>
                  <Text>{selectedInvoiceIds.length}</Text>
                </div>
                <Divider style={{ margin: '4px 0' }} />
                <Form.Item
                  name="amount"
                  label="Payment Amount"
                  rules={[
                    { required: true, message: 'Enter payment amount' },
                    { type: 'number', min: 0.01, message: 'Amount must be > 0' },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0.01}
                    precision={2}
                    prefix="₹"
                    value={paymentAmount}
                    onChange={(val) => setPaymentAmount(val ?? 0)}
                  />
                </Form.Item>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  )
}
