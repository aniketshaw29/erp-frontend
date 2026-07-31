import { useState } from 'react'
import {
  Form,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Divider,
  Typography,
  Table,
  Card,
  Input,
  message,
  Row,
  Col,
} from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import { getParties } from '../../api/modules/party.api'
import { getItems } from '../../api/modules/catalog.api'
import {
  getInvoices,
  createCreditNote,
  getStockBatches,
} from '../../api/modules/sales.api'
import type { StockBatch } from '../../api/modules/sales.api'
import type { CreditNoteLine } from '../../types/sales.types'

const { Title, Text } = Typography

// ── Types ─────────────────────────────────────────────────────────────────────

interface LineItem {
  key: string
  itemId: string
  itemName: string
  itemCode: string
  batchId: string
  batchNo: string
  batchExpiryDate?: string
  qty: number
  rate: number
  discount: number
  gstRate: number
  taxableAmount: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  gstAmount: number
  lineTotal: number
  batches: StockBatch[]
  batchesLoading: boolean
}

const INTER_STATE = false

function calcLine(item: Partial<LineItem>): Partial<LineItem> {
  const qty = item.qty ?? 0
  const rate = item.rate ?? 0
  const discount = item.discount ?? 0
  const gstRate = item.gstRate ?? 0
  const taxableAmount = qty * rate * (1 - discount / 100)
  const halfGst = taxableAmount * (gstRate / 200)
  const fullGst = taxableAmount * (gstRate / 100)
  const cgstAmount = INTER_STATE ? 0 : halfGst
  const sgstAmount = INTER_STATE ? 0 : halfGst
  const igstAmount = INTER_STATE ? fullGst : 0
  const gstAmount = fullGst
  const lineTotal = taxableAmount + gstAmount
  return { ...item, taxableAmount, cgstAmount, sgstAmount, igstAmount, gstAmount, lineTotal }
}

function newLine(): LineItem {
  return {
    key: `${Date.now()}-${Math.random()}`,
    itemId: '',
    itemName: '',
    itemCode: '',
    batchId: '',
    batchNo: '',
    batchExpiryDate: undefined,
    qty: 1,
    rate: 0,
    discount: 0,
    gstRate: 0,
    taxableAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    gstAmount: 0,
    lineTotal: 0,
    batches: [],
    batchesLoading: false,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreditNoteFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [lines, setLines] = useState<LineItem[]>([newLine()])
  const [customerId, setCustomerId] = useState<string | undefined>(undefined)

  // ── Data queries ──────────────────────────────────────────────────────────

  const { data: partiesData } = useQuery({
    queryKey: ['parties-customers'],
    queryFn: () => getParties({ size: 200, partyType: 'CUSTOMER' }).then((r) => r.data),
  })

  const { data: itemsData } = useQuery({
    queryKey: ['items-for-cn'],
    queryFn: () => getItems({ size: 200 }).then((r) => r.data),
  })

  const { data: invoicesData } = useQuery({
    queryKey: ['submitted-invoices-for-cn', customerId],
    queryFn: () =>
      getInvoices({ customerId, size: 100, status: 'SUBMITTED' }).then((r) => r.data),
    enabled: !!customerId,
  })

  const customerInvoices = invoicesData?.data ?? []

  // ── Line item helpers ─────────────────────────────────────────────────────

  const loadBatchesForLine = async (key: string, itemId: string) => {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, batchesLoading: true, batches: [] } : l)),
    )
    try {
      const res = await getStockBatches(itemId)
      const batches = res.data.data ?? []
      const sorted = [...batches].sort((a, b) => {
        if (!a.expiryDate) return 1
        if (!b.expiryDate) return -1
        return dayjs(a.expiryDate).unix() - dayjs(b.expiryDate).unix()
      })
      const firstBatch = sorted[0]
      setLines((prev) =>
        prev.map((l) => {
          if (l.key !== key) return l
          return {
            ...l,
            batches: sorted,
            batchesLoading: false,
            batchId: firstBatch?.id ?? '',
            batchNo: firstBatch?.batchNo ?? '',
            batchExpiryDate: firstBatch?.expiryDate,
          }
        }),
      )
    } catch {
      setLines((prev) =>
        prev.map((l) => (l.key === key ? { ...l, batchesLoading: false } : l)),
      )
    }
  }

  const addLine = () => setLines((prev) => [...prev, newLine()])
  const removeLine = (key: string) =>
    setLines((prev) => prev.filter((l) => l.key !== key))

  const updateLine = (key: string, field: keyof LineItem, value: any) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l
        const updated: LineItem = { ...l, [field]: value }

        if (field === 'itemId') {
          const item = itemsData?.find((i) => i.id === value)
          if (item) {
            updated.itemName = item.name
            updated.itemCode = item.code
            updated.gstRate = item.gstRate
            updated.rate = item.standardRate
            loadBatchesForLine(key, value as string)
          }
        }

        if (field === 'batchId') {
          const batch = l.batches.find((b) => b.id === value)
          if (batch) {
            updated.batchNo = batch.batchNo
            updated.batchExpiryDate = batch.expiryDate
          }
        }

        return calcLine(updated) as LineItem
      }),
    )
  }

  // ── Build payload ──────────────────────────────────────────────────────────

  const buildPayload = async (status: 'DRAFT' | 'SUBMITTED') => {
    const values = await form.validateFields()

    const cnLines: Omit<CreditNoteLine, 'id'>[] = lines
      .filter((l) => l.itemId)
      .map((l) => ({
        itemId: l.itemId,
        itemName: l.itemName,
        itemCode: l.itemCode,
        batchId: l.batchId || undefined,
        batchNo: l.batchNo || undefined,
        qty: l.qty,
        rate: l.rate,
        gstRate: l.gstRate,
        taxableAmount: l.taxableAmount,
        gstAmount: l.gstAmount,
        lineTotal: l.lineTotal,
      }))

    if (cnLines.length === 0) {
      message.warning('Add at least one line item')
      return null
    }

    const subtotal = lines.reduce((s, l) => s + l.taxableAmount, 0)
    const totalGst = lines.reduce((s, l) => s + l.gstAmount, 0)
    const customer = partiesData?.find((p) => p.id === values.customerId)
    const selectedInvoice = customerInvoices.find((i) => i.id === values.invoiceId)

    return {
      customerId: values.customerId,
      customerName: customer?.name ?? '',
      invoiceId: values.invoiceId || undefined,
      invoiceNo: selectedInvoice?.invoiceNo,
      creditNoteDate: values.creditNoteDate.format('YYYY-MM-DD'),
      reason: values.reason,
      notes: values.notes,
      lines: cnLines as CreditNoteLine[],
      subtotal,
      totalGst,
      grandTotal: subtotal + totalGst,
      status,
    }
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (payload: any) => createCreditNote(payload),
    onSuccess: () => {
      message.success('Credit note saved as draft')
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] })
      navigate('/sales/invoices')
    },
    onError: () => message.error('Failed to save credit note'),
  })

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      await createCreditNote({ ...payload, status: 'SUBMITTED' })
    },
    onSuccess: () => {
      message.success('Credit note submitted')
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      navigate('/sales/invoices')
    },
    onError: () => message.error('Failed to submit credit note'),
  })

  const handleSaveDraft = async () => {
    const payload = await buildPayload('DRAFT')
    if (payload) saveMutation.mutate(payload)
  }

  const handleSubmit = async () => {
    const payload = await buildPayload('SUBMITTED')
    if (payload) submitMutation.mutate(payload)
  }

  // ── Totals ────────────────────────────────────────────────────────────────

  const taxableTotal = lines.reduce((s, l) => s + l.taxableAmount, 0)
  const totalCgst = lines.reduce((s, l) => s + l.cgstAmount, 0)
  const totalSgst = lines.reduce((s, l) => s + l.sgstAmount, 0)
  const totalIgst = lines.reduce((s, l) => s + l.igstAmount, 0)
  const totalGst = lines.reduce((s, l) => s + l.gstAmount, 0)
  const grandTotal = taxableTotal + totalGst
  const hasIgst = lines.some((l) => l.igstAmount > 0)

  const isPending = saveMutation.isPending || submitMutation.isPending

  // ── Table columns ─────────────────────────────────────────────────────────

  const lineColumns = [
    {
      title: 'Item',
      key: 'itemId',
      width: 220,
      render: (_: unknown, record: LineItem) => (
        <Select
          showSearch
          placeholder="Select item"
          value={record.itemId || undefined}
          onChange={(val) => updateLine(record.key, 'itemId', val as string)}
          style={{ width: '100%' }}
          optionFilterProp="label"
          options={itemsData?.map((i) => ({
            value: i.id,
            label: `${i.code} — ${i.name}`,
          }))}
        />
      ),
    },
    {
      title: 'Batch',
      key: 'batchId',
      width: 160,
      render: (_: unknown, record: LineItem) => (
        <Select
          placeholder="Select batch"
          value={record.batchId || undefined}
          onChange={(val) => updateLine(record.key, 'batchId', val as string)}
          style={{ width: '100%' }}
          loading={record.batchesLoading}
          disabled={!record.itemId}
          options={record.batches.map((b) => ({
            value: b.id,
            label: `${b.batchNo}${b.expiryDate ? ` (${dayjs(b.expiryDate).format('MM/YY')})` : ''}`,
          }))}
        />
      ),
    },
    {
      title: 'Qty',
      key: 'qty',
      width: 90,
      render: (_: unknown, record: LineItem) => (
        <InputNumber
          min={0.001}
          precision={3}
          value={record.qty}
          onChange={(val) => updateLine(record.key, 'qty', val ?? 0)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Rate',
      key: 'rate',
      width: 110,
      render: (_: unknown, record: LineItem) => (
        <InputNumber
          min={0}
          precision={2}
          value={record.rate}
          onChange={(val) => updateLine(record.key, 'rate', val ?? 0)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Taxable Amt',
      key: 'taxableAmount',
      align: 'right' as const,
      width: 120,
      render: (_: unknown, record: LineItem) => (
        <Text type="secondary">
          <AmountDisplay amount={record.taxableAmount} />
        </Text>
      ),
    },
    {
      title: 'GST %',
      key: 'gstRate',
      width: 70,
      render: (_: unknown, record: LineItem) => (
        <InputNumber
          disabled
          value={record.gstRate}
          style={{ width: '100%' }}
          formatter={(v) => `${v}%`}
        />
      ),
    },
    {
      title: 'CGST',
      key: 'cgstAmount',
      align: 'right' as const,
      width: 100,
      render: (_: unknown, record: LineItem) => (
        <Text type="secondary">
          <AmountDisplay amount={record.cgstAmount} />
        </Text>
      ),
    },
    {
      title: 'SGST',
      key: 'sgstAmount',
      align: 'right' as const,
      width: 100,
      render: (_: unknown, record: LineItem) => (
        <Text type="secondary">
          <AmountDisplay amount={record.sgstAmount} />
        </Text>
      ),
    },
    {
      title: 'IGST',
      key: 'igstAmount',
      align: 'right' as const,
      width: 100,
      render: (_: unknown, record: LineItem) => (
        <Text type="secondary">
          <AmountDisplay amount={record.igstAmount} />
        </Text>
      ),
    },
    {
      title: 'Line Total',
      key: 'lineTotal',
      align: 'right' as const,
      width: 130,
      render: (_: unknown, record: LineItem) => (
        <strong>
          <AmountDisplay amount={record.lineTotal} />
        </strong>
      ),
    },
    {
      title: '',
      key: 'remove',
      width: 44,
      render: (_: unknown, record: LineItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeLine(record.key)}
          disabled={lines.length === 1}
        />
      ),
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="New Credit Note"
        subtitle="Issue a credit note to a customer"
        actions={
          <Space>
            <Button onClick={() => navigate('/sales/invoices')} disabled={isPending}>
              Cancel
            </Button>
            <Button
              icon={<SaveOutlined />}
              onClick={handleSaveDraft}
              loading={saveMutation.isPending}
              disabled={submitMutation.isPending}
            >
              Save Draft
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={submitMutation.isPending}
              disabled={saveMutation.isPending}
            >
              Submit
            </Button>
          </Space>
        }
      />

      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={7}>
            <Form.Item
              name="customerId"
              label="Customer"
              rules={[{ required: true, message: 'Select a customer' }]}
            >
              <Select
                showSearch
                placeholder="Select customer"
                optionFilterProp="label"
                options={partiesData?.map((p) => ({ value: p.id, label: p.name }))}
                onChange={(val) => {
                  setCustomerId(val)
                  form.setFieldValue('invoiceId', undefined)
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={7}>
            <Form.Item name="invoiceId" label="Against Invoice (optional)">
              <Select
                showSearch
                allowClear
                placeholder="Select invoice"
                optionFilterProp="label"
                disabled={!customerId}
                options={customerInvoices.map((inv) => ({
                  value: inv.id,
                  label: `${inv.invoiceNo} — ${dayjs(inv.invoiceDate).format('DD/MM/YYYY')}`,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={5}>
            <Form.Item
              name="creditNoteDate"
              label="Credit Note Date"
              rules={[{ required: true, message: 'Select a date' }]}
              initialValue={dayjs()}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={5}>
            <Form.Item
              name="reason"
              label="Reason"
              rules={[{ required: true, message: 'Enter reason for credit note' }]}
            >
              <Input placeholder="Reason for credit note" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Line Items</Divider>

        <Table
          dataSource={lines}
          columns={lineColumns}
          rowKey="key"
          pagination={false}
          footer={() => (
            <Button type="dashed" icon={<PlusOutlined />} onClick={addLine} block>
              Add Line
            </Button>
          )}
          scroll={{ x: 1300 }}
          size="small"
        />

        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col xs={24} sm={14}>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={3} placeholder="Additional notes..." />
            </Form.Item>
          </Col>
          <Col xs={24} sm={10}>
            <Card size="small">
              <Title level={5} style={{ marginTop: 0 }}>
                Summary
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Taxable Total</Text>
                  <Text>
                    <AmountDisplay amount={taxableTotal} />
                  </Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">CGST</Text>
                  <Text>
                    <AmountDisplay amount={totalCgst} />
                  </Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">SGST</Text>
                  <Text>
                    <AmountDisplay amount={totalSgst} />
                  </Text>
                </div>
                {hasIgst && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">IGST</Text>
                    <Text>
                      <AmountDisplay amount={totalIgst} />
                    </Text>
                  </div>
                )}
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong style={{ fontSize: 15 }}>
                    Credit Total
                  </Text>
                  <Text strong style={{ fontSize: 15 }}>
                    <AmountDisplay amount={grandTotal} />
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  )
}
