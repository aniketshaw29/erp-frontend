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
  Tooltip,
} from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined, SendOutlined, WarningOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import { getParties } from '../../api/modules/party.api'
import { getItems } from '../../api/modules/catalog.api'
import {
  createInvoice,
  submitInvoice,
  getStockBatches,
} from '../../api/modules/sales.api'
import type { StockBatch } from '../../api/modules/sales.api'
import type { InvoiceLine } from '../../types/sales.types'

const { Title, Text } = Typography

// ── Helpers ─────────────────────────────────────────────────────────────────

const PAYMENT_TERMS = ['NET30', 'NET60', 'NET90', 'COD', 'ADVANCE'] as const

// For demo purposes we treat the company as intra-state (CGST + SGST).
// If the customer's state differs this would flip to IGST. Hard-coded for now
// since we don't have a "company state" field in scope.
const INTER_STATE = false

interface LineItem {
  key: string
  itemId: string
  itemName: string
  itemCode: string
  batchId: string
  batchNo: string
  batchExpiryDate?: string
  mrp: number
  qty: number
  rate: number
  rateExceedsMrp: boolean
  discount: number
  gstRate: number
  taxableAmount: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  gstAmount: number
  lineTotal: number
  // batch options loaded for this line
  batches: StockBatch[]
  batchesLoading: boolean
}

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
    mrp: 0,
    qty: 1,
    rate: 0,
    rateExceedsMrp: false,
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

// ── Component ────────────────────────────────────────────────────────────────

export default function InvoiceFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [lines, setLines] = useState<LineItem[]>([newLine()])

  // ── Data queries ───────────────────────────────────────────────────────────

  const { data: partiesData } = useQuery({
    queryKey: ['parties-customers'],
    queryFn: () => getParties({ size: 200, partyType: 'CUSTOMER' }).then((r) => r.data),
  })

  const { data: itemsData } = useQuery({
    queryKey: ['items-for-invoice'],
    queryFn: () => getItems({ size: 200 }).then((r) => r.data),
  })

  // ── Mutations ──────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (payload: any) => createInvoice(payload),
    onSuccess: () => {
      message.success('Invoice saved as draft')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      navigate('/sales/invoices')
    },
    onError: () => message.error('Failed to save invoice'),
  })

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await createInvoice(payload)
      const invoiceId = res.data.data.id
      await submitInvoice(invoiceId)
    },
    onSuccess: () => {
      message.success('Invoice submitted')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      navigate('/sales/invoices')
    },
    onError: () => message.error('Failed to submit invoice'),
  })

  // ── Line item helpers ──────────────────────────────────────────────────────

  const loadBatchesForLine = async (key: string, itemId: string) => {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, batchesLoading: true, batches: [] } : l)),
    )
    try {
      const res = await getStockBatches(itemId)
      const batches = res.data.data ?? []
      // FEFO: sort by expiry date, pick earliest
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
            mrp: firstBatch?.mrp ?? l.mrp,
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
            updated.mrp = item.mrp
            updated.rateExceedsMrp = false
            // async: load batches after state update
            loadBatchesForLine(key, value as string)
          }
        }

        if (field === 'batchId') {
          const batch = l.batches.find((b) => b.id === value)
          if (batch) {
            updated.batchNo = batch.batchNo
            updated.batchExpiryDate = batch.expiryDate
            updated.mrp = batch.mrp
          }
        }

        // Validate rate vs MRP (check after setting rate)
        const rateToCheck = field === 'rate' ? (value as number) : updated.rate
        updated.rateExceedsMrp = updated.mrp > 0 && rateToCheck > updated.mrp

        return calcLine(updated) as LineItem
      }),
    )
  }

  const handleRateBlur = (_key: string, rate: number, mrp: number) => {
    if (mrp > 0 && rate > mrp) {
      message.warning(`Rate ₹${rate} exceeds MRP ₹${mrp}`)
    }
  }

  // ── Build payload ──────────────────────────────────────────────────────────

  const buildPayload = async (status: 'DRAFT' | 'SUBMITTED') => {
    const values = await form.validateFields()

    const invoiceLines: Omit<InvoiceLine, 'id'>[] = lines
      .filter((l) => l.itemId)
      .map((l) => ({
        itemId: l.itemId,
        itemName: l.itemName,
        itemCode: l.itemCode,
        batchId: l.batchId || undefined,
        batchNo: l.batchNo || undefined,
        qty: l.qty,
        rate: l.rate,
        discount: l.discount,
        gstRate: l.gstRate,
        taxableAmount: l.taxableAmount,
        cgstAmount: l.cgstAmount,
        sgstAmount: l.sgstAmount,
        igstAmount: l.igstAmount,
        gstAmount: l.gstAmount,
        lineTotal: l.lineTotal,
      }))

    if (invoiceLines.length === 0) {
      message.warning('Add at least one line item')
      return null
    }

    const taxableTotal = lines.reduce((s, l) => s + l.taxableAmount, 0)
    const totalCgst = lines.reduce((s, l) => s + l.cgstAmount, 0)
    const totalSgst = lines.reduce((s, l) => s + l.sgstAmount, 0)
    const totalIgst = lines.reduce((s, l) => s + l.igstAmount, 0)
    const totalGst = lines.reduce((s, l) => s + l.gstAmount, 0)
    const grandTotal = taxableTotal + totalGst

    const customer = partiesData?.find((p) => p.id === values.customerId)

    return {
      customerId: values.customerId,
      customerName: customer?.name ?? '',
      invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
      dueDate: values.dueDate?.format('YYYY-MM-DD'),
      paymentTerms: values.paymentTerms,
      notes: values.notes,
      lines: invoiceLines as InvoiceLine[],
      subtotal: taxableTotal,
      totalDiscount: 0,
      totalTaxableAmount: taxableTotal,
      totalCgst,
      totalSgst,
      totalIgst,
      totalGst,
      roundOff: 0,
      grandTotal,
      paidAmount: 0,
      outstandingAmount: grandTotal,
      status,
    }
  }

  const handleSaveDraft = async () => {
    const payload = await buildPayload('DRAFT')
    if (payload) saveMutation.mutate(payload)
  }

  const handleSubmit = async () => {
    const payload = await buildPayload('SUBMITTED')
    if (payload) submitMutation.mutate(payload)
  }

  // ── Totals ─────────────────────────────────────────────────────────────────

  const taxableTotal = lines.reduce((s, l) => s + l.taxableAmount, 0)
  const totalCgst = lines.reduce((s, l) => s + l.cgstAmount, 0)
  const totalSgst = lines.reduce((s, l) => s + l.sgstAmount, 0)
  const totalIgst = lines.reduce((s, l) => s + l.igstAmount, 0)
  const totalGst = lines.reduce((s, l) => s + l.gstAmount, 0)
  const grandTotal = taxableTotal + totalGst
  const hasIgst = lines.some((l) => l.igstAmount > 0)

  const isPending = saveMutation.isPending || submitMutation.isPending

  // ── Table columns ──────────────────────────────────────────────────────────

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
        <Tooltip
          title={record.rateExceedsMrp ? `Exceeds MRP ₹${record.mrp}` : undefined}
          color="orange"
          open={record.rateExceedsMrp}
        >
          <InputNumber
            min={0}
            precision={2}
            value={record.rate}
            onChange={(val) => updateLine(record.key, 'rate', val ?? 0)}
            onBlur={() => handleRateBlur(record.key, record.rate, record.mrp)}
            style={{
              width: '100%',
              borderColor: record.rateExceedsMrp ? '#faad14' : undefined,
            }}
            suffix={
              record.rateExceedsMrp ? (
                <WarningOutlined style={{ color: '#faad14' }} />
              ) : undefined
            }
          />
        </Tooltip>
      ),
    },
    {
      title: 'Disc %',
      key: 'discount',
      width: 80,
      render: (_: unknown, record: LineItem) => (
        <InputNumber
          min={0}
          max={100}
          precision={2}
          value={record.discount}
          onChange={(val) => updateLine(record.key, 'discount', val ?? 0)}
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="New Invoice"
        subtitle="Create a sales invoice"
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
              Submit Invoice
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
                placeholder="Select customer"
                optionFilterProp="label"
                options={partiesData?.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={5}>
            <Form.Item
              name="invoiceDate"
              label="Invoice Date"
              rules={[{ required: true, message: 'Select invoice date' }]}
              initialValue={dayjs()}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={5}>
            <Form.Item name="dueDate" label="Due Date">
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="paymentTerms" label="Payment Terms">
              <Select
                allowClear
                placeholder="Select terms"
                options={PAYMENT_TERMS.map((t) => ({ value: t, label: t }))}
              />
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
          scroll={{ x: 1400 }}
          size="small"
        />

        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col xs={24} sm={14}>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={3} placeholder="Delivery instructions, notes to customer..." />
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
                    Grand Total
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
