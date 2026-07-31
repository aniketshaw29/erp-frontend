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
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import PageHeader from '../../components/PageHeader'
import { getParties } from '../../api/modules/party.api'
import { getItems } from '../../api/modules/catalog.api'
import { createInvoice } from '../../api/modules/sales.api'
import type { InvoiceLine } from '../../types/sales.types'

const { Title, Text } = Typography
const { Option } = Select

interface LineItem {
  key: string
  itemId: string
  itemName: string
  qty: number
  rate: number
  discount: number
  gstRate: number
  taxableAmount: number
  gstAmount: number
  lineTotal: number
}

function calcLine(item: Partial<LineItem>): Partial<LineItem> {
  const qty = item.qty ?? 0
  const rate = item.rate ?? 0
  const discount = item.discount ?? 0
  const gstRate = item.gstRate ?? 0
  const taxableAmount = qty * rate * (1 - discount / 100)
  const gstAmount = taxableAmount * (gstRate / 100)
  return { ...item, taxableAmount, gstAmount, lineTotal: taxableAmount + gstAmount }
}

export default function InvoiceFormPage() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [lines, setLines] = useState<LineItem[]>([])

  const { data: partiesData } = useQuery({
    queryKey: ['parties-for-select'],
    queryFn: () => getParties({ size: 100 }),
  })

  const { data: itemsData } = useQuery({
    queryKey: ['items-for-select'],
    queryFn: () => getItems({ size: 100 }),
  })

  const mutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      navigate('/sales/invoices')
    },
  })

  const addLine = () => {
    const newLine: LineItem = {
      key: Date.now().toString(),
      itemId: '',
      itemName: '',
      qty: 1,
      rate: 0,
      discount: 0,
      gstRate: 18,
      taxableAmount: 0,
      gstAmount: 0,
      lineTotal: 0,
    }
    setLines((prev) => [...prev, newLine])
  }

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key))
  }

  const updateLine = (key: string, field: keyof LineItem, value: number | string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l
        const updated = { ...l, [field]: value }
        if (field === 'itemId') {
          const item = itemsData?.data.find((i) => i.id === value)
          if (item) {
            updated.itemName = item.name
            updated.gstRate = item.gstRate
            updated.rate = item.standardRate
          }
        }
        return calcLine(updated) as LineItem
      }),
    )
  }

  const subtotal = lines.reduce((s, l) => s + l.taxableAmount, 0)
  const totalGst = lines.reduce((s, l) => s + l.gstAmount, 0)
  const grandTotal = subtotal + totalGst

  const handleSubmit = async () => {
    await form.validateFields()
    const values = form.getFieldsValue()
    const invoiceLines: Omit<InvoiceLine, 'id'>[] = lines.map((l) => ({
      itemId: l.itemId,
      itemName: l.itemName,
      itemCode: '',
      qty: l.qty,
      rate: l.rate,
      discount: l.discount,
      gstRate: l.gstRate,
      taxableAmount: l.taxableAmount,
      gstAmount: l.gstAmount,
      lineTotal: l.lineTotal,
    }))
    mutation.mutate({
      customerId: values.customerId,
      customerName: partiesData?.data.find((p) => p.id === values.customerId)?.name ?? '',
      invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
      lines: invoiceLines as InvoiceLine[],
      subtotal,
      totalDiscount: 0,
      totalTaxableAmount: subtotal,
      totalGst,
      grandTotal,
      paidAmount: 0,
      outstandingAmount: grandTotal,
      status: 'DRAFT',
    })
  }

  const lineColumns = [
    {
      title: 'Item',
      key: 'itemId',
      width: 240,
      render: (_: unknown, record: LineItem) => (
        <Select
          showSearch
          placeholder="Select item"
          value={record.itemId || undefined}
          onChange={(val) => updateLine(record.key, 'itemId', val as string)}
          style={{ width: '100%' }}
          optionFilterProp="label"
          options={itemsData?.data.map((i) => ({ value: i.id, label: `${i.code} — ${i.name}` }))}
        />
      ),
    },
    {
      title: 'Qty',
      key: 'qty',
      width: 100,
      render: (_: unknown, record: LineItem) => (
        <InputNumber
          min={0}
          value={record.qty}
          onChange={(val) => updateLine(record.key, 'qty', val ?? 0)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Rate',
      key: 'rate',
      width: 120,
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
      title: 'Disc %',
      key: 'discount',
      width: 100,
      render: (_: unknown, record: LineItem) => (
        <InputNumber
          min={0}
          max={100}
          value={record.discount}
          onChange={(val) => updateLine(record.key, 'discount', val ?? 0)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'GST %',
      key: 'gstRate',
      width: 100,
      render: (_: unknown, record: LineItem) => (
        <InputNumber
          min={0}
          max={28}
          value={record.gstRate}
          onChange={(val) => updateLine(record.key, 'gstRate', val ?? 0)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Total',
      key: 'lineTotal',
      align: 'right' as const,
      render: (_: unknown, record: LineItem) => `₹${record.lineTotal.toFixed(2)}`,
    },
    {
      title: '',
      key: 'remove',
      width: 48,
      render: (_: unknown, record: LineItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeLine(record.key)}
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="New Invoice"
        subtitle="Create a sales invoice"
        actions={
          <Space>
            <Button onClick={() => navigate('/sales/invoices')}>Cancel</Button>
            <Button type="primary" onClick={handleSubmit} loading={mutation.isPending}>
              Save Invoice
            </Button>
          </Space>
        }
      />

      <Form form={form} layout="vertical">
        <Space size={16} style={{ width: '100%' }} direction="horizontal">
          <Form.Item name="customerId" label="Customer" rules={[{ required: true }]} style={{ width: 300 }}>
            <Select
              showSearch
              placeholder="Select customer"
              optionFilterProp="label"
              options={partiesData?.data
                .filter((p) => p.partyType === 'CUSTOMER' || p.partyType === 'BOTH')
                .map((p) => ({ value: p.id, label: p.name }))}
            />
          </Form.Item>
          <Form.Item name="invoiceDate" label="Invoice Date" rules={[{ required: true }]}>
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
        </Space>

        <Divider>Line Items</Divider>

        <Table
          dataSource={lines}
          columns={lineColumns}
          rowKey="key"
          pagination={false}
          footer={() => (
            <Button type="dashed" icon={<PlusOutlined />} onClick={addLine}>
              Add Line
            </Button>
          )}
          scroll={{ x: 800 }}
        />

        <Card style={{ marginTop: 24, maxWidth: 400, marginLeft: 'auto' }}>
          <Title level={5}>Summary</Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">Subtotal (Taxable)</Text>
              <Text>₹{subtotal.toFixed(2)}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">Total GST</Text>
              <Text>₹{totalGst.toFixed(2)}</Text>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong>Grand Total</Text>
              <Text strong style={{ fontSize: 16 }}>
                ₹{grandTotal.toFixed(2)}
              </Text>
            </div>
          </div>
        </Card>
      </Form>
    </div>
  )
}
