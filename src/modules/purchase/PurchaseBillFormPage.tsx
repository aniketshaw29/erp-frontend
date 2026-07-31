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
  createPurchaseBill,
  submitPurchaseBill,
} from '../../api/modules/purchase.api'
import type { BillLine } from '../../types/purchase.types'

const { Title, Text } = Typography

interface BillLineItem {
  key: string
  itemId: string
  itemName: string
  description: string
  qty: number
  rate: number
  discount: number
  gstRate: number
  taxableAmount: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  lineTotal: number
}

function calcLine(item: Partial<BillLineItem>): Partial<BillLineItem> {
  const qty = item.qty ?? 0
  const rate = item.rate ?? 0
  const discount = item.discount ?? 0
  const gstRate = item.gstRate ?? 0
  const taxableAmount = qty * rate * (1 - discount / 100)
  const gstTotal = taxableAmount * (gstRate / 100)
  // For intra-state: split CGST+SGST; for inter-state: IGST (default intra)
  const cgstAmount = gstTotal / 2
  const sgstAmount = gstTotal / 2
  const igstAmount = 0
  const lineTotal = taxableAmount + gstTotal
  return { ...item, taxableAmount, cgstAmount, sgstAmount, igstAmount, lineTotal }
}

function newLine(): BillLineItem {
  return {
    key: `${Date.now()}-${Math.random()}`,
    itemId: '',
    itemName: '',
    description: '',
    qty: 1,
    rate: 0,
    discount: 0,
    gstRate: 0,
    taxableAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    lineTotal: 0,
  }
}

export default function PurchaseBillFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [lines, setLines] = useState<BillLineItem[]>([newLine()])

  const { data: partiesData } = useQuery({
    queryKey: ['parties-vendors'],
    queryFn: () => getParties({ size: 200, partyType: 'VENDOR' }).then((r) => r.data),
  })

  const { data: itemsData } = useQuery({
    queryKey: ['items-for-bill'],
    queryFn: () => getItems({ size: 200 }).then((r) => r.data),
  })

  const buildPayload = async () => {
    const values = await form.validateFields()
    const billLines: Omit<BillLine, 'id'>[] = lines
      .filter((l) => l.itemId || l.description)
      .map((l) => ({
        itemId: l.itemId || undefined,
        itemName: l.itemName || undefined,
        description: l.description || undefined,
        qty: l.qty,
        rate: l.rate,
        discount: l.discount,
        gstRate: l.gstRate,
        taxableAmount: l.taxableAmount,
        cgstAmount: l.cgstAmount,
        sgstAmount: l.sgstAmount,
        igstAmount: l.igstAmount,
        lineTotal: l.lineTotal,
      }))

    if (billLines.length === 0) {
      message.warning('Add at least one line item')
      return null
    }

    const subtotal = lines.reduce((s, l) => s + l.taxableAmount, 0)
    const totalGst = lines.reduce((s, l) => s + l.cgstAmount + l.sgstAmount + l.igstAmount, 0)
    const supplier = partiesData?.data?.find((p) => p.id === values.supplierId)

    return {
      supplierId: values.supplierId,
      supplierName: supplier?.name ?? '',
      supplierInvoiceNo: values.supplierInvoiceNo,
      supplierInvoiceDate: values.supplierInvoiceDate?.format('YYYY-MM-DD'),
      billDate: values.billDate.format('YYYY-MM-DD'),
      dueDate: values.dueDate?.format('YYYY-MM-DD'),
      lines: billLines,
      subtotal,
      totalGst,
      grandTotal: subtotal + totalGst,
      paidAmount: 0,
      outstandingAmount: subtotal + totalGst,
      notes: values.notes,
      status: 'DRAFT',
    }
  }

  const saveMutation = useMutation({
    mutationFn: (payload: any) => createPurchaseBill(payload),
    onSuccess: () => {
      message.success('Bill saved as draft')
      queryClient.invalidateQueries({ queryKey: ['purchase-bills'] })
      navigate('/purchase/bills')
    },
    onError: () => message.error('Failed to save bill'),
  })

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await createPurchaseBill(payload)
      await submitPurchaseBill(res.data.data.id)
    },
    onSuccess: () => {
      message.success('Bill submitted')
      queryClient.invalidateQueries({ queryKey: ['purchase-bills'] })
      navigate('/purchase/bills')
    },
    onError: () => message.error('Failed to submit bill'),
  })

  const handleSave = async () => {
    const payload = await buildPayload()
    if (payload) saveMutation.mutate(payload)
  }

  const handleSubmit = async () => {
    const payload = await buildPayload()
    if (payload) submitMutation.mutate(payload)
  }

  const addLine = () => setLines((prev) => [...prev, newLine()])
  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key))

  const updateLine = (key: string, field: keyof BillLineItem, value: any) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l
        const updated = { ...l, [field]: value }
        if (field === 'itemId') {
          const item = itemsData?.data?.find((i) => i.id === value)
          if (item) {
            updated.itemName = item.name
            updated.gstRate = item.gstRate
            updated.rate = item.purchaseRate || item.standardRate
            updated.description = item.name
          }
        }
        return calcLine(updated) as BillLineItem
      }),
    )
  }

  const taxableTotal = lines.reduce((s, l) => s + l.taxableAmount, 0)
  const cgstTotal = lines.reduce((s, l) => s + l.cgstAmount, 0)
  const sgstTotal = lines.reduce((s, l) => s + l.sgstAmount, 0)
  const igstTotal = lines.reduce((s, l) => s + l.igstAmount, 0)
  const grandTotal = taxableTotal + cgstTotal + sgstTotal + igstTotal
  const isPending = saveMutation.isPending || submitMutation.isPending

  const lineColumns = [
    {
      title: 'Item',
      key: 'itemId',
      width: 200,
      render: (_: unknown, record: BillLineItem) => (
        <Select
          showSearch
          allowClear
          placeholder="Select item"
          value={record.itemId || undefined}
          onChange={(val) => updateLine(record.key, 'itemId', val ?? '')}
          style={{ width: '100%' }}
          optionFilterProp="label"
          options={itemsData?.data?.map((i) => ({ value: i.id, label: `${i.code} — ${i.name}` }))}
        />
      ),
    },
    {
      title: 'Description',
      key: 'description',
      width: 180,
      render: (_: unknown, record: BillLineItem) => (
        <Input
          value={record.description}
          onChange={(e) => updateLine(record.key, 'description', e.target.value)}
          placeholder="Description"
        />
      ),
    },
    {
      title: 'Qty',
      key: 'qty',
      width: 90,
      render: (_: unknown, record: BillLineItem) => (
        <InputNumber
          min={0}
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
      width: 100,
      render: (_: unknown, record: BillLineItem) => (
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
      title: 'Disc %',
      key: 'discount',
      width: 80,
      render: (_: unknown, record: BillLineItem) => (
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
      title: 'GST %',
      key: 'gstRate',
      width: 80,
      render: (_: unknown, record: BillLineItem) => (
        <InputNumber
          min={0}
          max={28}
          precision={1}
          value={record.gstRate}
          onChange={(val) => updateLine(record.key, 'gstRate', val ?? 0)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Taxable',
      key: 'taxableAmount',
      align: 'right' as const,
      width: 110,
      render: (_: unknown, record: BillLineItem) => <AmountDisplay amount={record.taxableAmount} />,
    },
    {
      title: 'CGST',
      key: 'cgstAmount',
      align: 'right' as const,
      width: 90,
      render: (_: unknown, record: BillLineItem) => <AmountDisplay amount={record.cgstAmount} />,
    },
    {
      title: 'SGST',
      key: 'sgstAmount',
      align: 'right' as const,
      width: 90,
      render: (_: unknown, record: BillLineItem) => <AmountDisplay amount={record.sgstAmount} />,
    },
    {
      title: 'Total',
      key: 'lineTotal',
      align: 'right' as const,
      width: 110,
      render: (_: unknown, record: BillLineItem) => (
        <strong><AmountDisplay amount={record.lineTotal} /></strong>
      ),
    },
    {
      title: '',
      key: 'remove',
      width: 44,
      render: (_: unknown, record: BillLineItem) => (
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

  return (
    <div>
      <PageHeader
        title="New Purchase Bill"
        subtitle="Enter supplier invoice"
        actions={
          <Space>
            <Button onClick={() => navigate('/purchase/bills')} disabled={isPending}>Cancel</Button>
            <Button
              icon={<SaveOutlined />}
              onClick={handleSave}
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
          <Col xs={24} sm={8}>
            <Form.Item
              name="supplierId"
              label="Supplier"
              rules={[{ required: true, message: 'Select a supplier' }]}
            >
              <Select
                showSearch
                placeholder="Select supplier"
                optionFilterProp="label"
                options={partiesData?.data?.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="supplierInvoiceNo" label="Supplier Invoice No">
              <Input placeholder="Supplier's invoice number" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="supplierInvoiceDate" label="Supplier Invoice Date">
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="billDate"
              label="Our Bill Date"
              rules={[{ required: true, message: 'Select bill date' }]}
              initialValue={dayjs()}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="dueDate" label="Due Date">
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
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
          scroll={{ x: 1200 }}
          size="small"
        />

        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col xs={24} sm={14}>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={3} placeholder="Internal notes..." />
            </Form.Item>
          </Col>
          <Col xs={24} sm={10}>
            <Card size="small">
              <Title level={5} style={{ marginTop: 0 }}>Summary</Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Taxable Total</Text>
                  <Text><AmountDisplay amount={taxableTotal} /></Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">CGST</Text>
                  <Text><AmountDisplay amount={cgstTotal} /></Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">SGST</Text>
                  <Text><AmountDisplay amount={sgstTotal} /></Text>
                </div>
                {igstTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">IGST</Text>
                    <Text><AmountDisplay amount={igstTotal} /></Text>
                  </div>
                )}
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong style={{ fontSize: 15 }}>Grand Total</Text>
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
