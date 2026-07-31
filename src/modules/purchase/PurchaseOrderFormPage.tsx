import { useState, useEffect } from 'react'
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
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import { getParties } from '../../api/modules/party.api'
import { getItems } from '../../api/modules/catalog.api'
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  getPurchaseOrder,
  submitPurchaseOrder,
} from '../../api/modules/purchase.api'
import type { PurchaseOrderLine } from '../../types/purchase.types'

const { Title, Text } = Typography

interface LineItem {
  key: string
  itemId: string
  itemName: string
  itemCode: string
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

function newLine(): LineItem {
  return {
    key: `${Date.now()}-${Math.random()}`,
    itemId: '',
    itemName: '',
    itemCode: '',
    qty: 1,
    rate: 0,
    discount: 0,
    gstRate: 0,
    taxableAmount: 0,
    gstAmount: 0,
    lineTotal: 0,
  }
}

export default function PurchaseOrderFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [lines, setLines] = useState<LineItem[]>([newLine()])

  const { data: partiesData } = useQuery({
    queryKey: ['parties-vendors'],
    queryFn: () => getParties({ size: 200, partyType: 'VENDOR' }).then((r) => r.data),
  })

  const { data: itemsData } = useQuery({
    queryKey: ['items-for-po'],
    queryFn: () => getItems({ size: 200 }).then((r) => r.data),
  })

  const { data: existingPO } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => getPurchaseOrder(id!).then((r) => r.data.data),
    enabled: isEdit,
  })

  // Populate form when editing
  useEffect(() => {
    if (existingPO) {
      form.setFieldsValue({
        supplierId: existingPO.supplierId,
        orderDate: dayjs(existingPO.orderDate),
        expectedDeliveryDate: existingPO.expectedDeliveryDate
          ? dayjs(existingPO.expectedDeliveryDate)
          : undefined,
        notes: existingPO.notes,
      })
      setLines(
        existingPO.lines.map((l) => ({
          key: l.id,
          itemId: l.itemId,
          itemName: l.itemName,
          itemCode: l.itemCode,
          qty: l.qty,
          rate: l.rate,
          discount: l.discount ?? 0,
          gstRate: l.gstRate,
          taxableAmount: l.taxableAmount,
          gstAmount: l.gstAmount,
          lineTotal: l.lineTotal,
        })),
      )
    }
  }, [existingPO, form])

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      isEdit ? updatePurchaseOrder(id!, payload) : createPurchaseOrder(payload),
    onSuccess: (res) => {
      message.success(isEdit ? 'Purchase order updated' : 'Purchase order created')
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      navigate('/purchase/orders')
    },
    onError: () => message.error('Failed to save purchase order'),
  })

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      let orderId = id
      if (!isEdit) {
        const res = await createPurchaseOrder(payload)
        orderId = res.data.data.id
      } else {
        await updatePurchaseOrder(id!, payload)
      }
      await submitPurchaseOrder(orderId!)
      return orderId
    },
    onSuccess: () => {
      message.success('Purchase order submitted')
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      navigate('/purchase/orders')
    },
    onError: () => message.error('Failed to submit purchase order'),
  })

  const buildPayload = async () => {
    const values = await form.validateFields()
    const poLines: Omit<PurchaseOrderLine, 'id'>[] = lines
      .filter((l) => l.itemId)
      .map((l) => ({
        itemId: l.itemId,
        itemName: l.itemName,
        itemCode: l.itemCode,
        qty: l.qty,
        rate: l.rate,
        discount: l.discount,
        gstRate: l.gstRate,
        taxableAmount: l.taxableAmount,
        gstAmount: l.gstAmount,
        lineTotal: l.lineTotal,
      }))

    if (poLines.length === 0) {
      message.warning('Add at least one line item')
      return null
    }

    const subtotal = lines.reduce((s, l) => s + l.taxableAmount, 0)
    const totalGst = lines.reduce((s, l) => s + l.gstAmount, 0)

    return {
      supplierId: values.supplierId,
      supplierName: partiesData?.data?.find((p) => p.id === values.supplierId)?.name ?? '',
      orderDate: values.orderDate.format('YYYY-MM-DD'),
      expectedDeliveryDate: values.expectedDeliveryDate?.format('YYYY-MM-DD'),
      notes: values.notes,
      lines: poLines,
      subtotal,
      totalGst,
      grandTotal: subtotal + totalGst,
      status: 'DRAFT',
    }
  }

  const handleSave = async () => {
    const payload = await buildPayload()
    if (payload) saveMutation.mutate(payload)
  }

  const handleSubmit = async () => {
    const payload = await buildPayload()
    if (payload) submitMutation.mutate(payload)
  }

  const addLine = () => setLines((prev) => [...prev, newLine()])

  const removeLine = (key: string) =>
    setLines((prev) => prev.filter((l) => l.key !== key))

  const updateLine = (key: string, field: keyof LineItem, value: number | string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l
        const updated = { ...l, [field]: value }
        if (field === 'itemId') {
          const item = itemsData?.data?.find((i) => i.id === value)
          if (item) {
            updated.itemName = item.name
            updated.itemCode = item.code
            updated.gstRate = item.gstRate
            updated.rate = item.purchaseRate || item.standardRate
          }
        }
        return calcLine(updated) as LineItem
      }),
    )
  }

  const taxableTotal = lines.reduce((s, l) => s + l.taxableAmount, 0)
  const gstTotal = lines.reduce((s, l) => s + l.gstAmount, 0)
  const grandTotal = taxableTotal + gstTotal

  const lineColumns = [
    {
      title: 'Item',
      key: 'itemId',
      width: 260,
      render: (_: unknown, record: LineItem) => (
        <Select
          showSearch
          placeholder="Select item"
          value={record.itemId || undefined}
          onChange={(val) => updateLine(record.key, 'itemId', val as string)}
          style={{ width: '100%' }}
          optionFilterProp="label"
          options={itemsData?.data?.map((i) => ({
            value: i.id,
            label: `${i.code} — ${i.name}`,
          }))}
        />
      ),
    },
    {
      title: 'Qty',
      key: 'qty',
      width: 100,
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
      width: 90,
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
      render: (_: unknown, record: LineItem) => <AmountDisplay amount={record.taxableAmount} />,
    },
    {
      title: 'GST %',
      key: 'gstRate',
      width: 90,
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
      title: 'Total',
      key: 'lineTotal',
      align: 'right' as const,
      width: 130,
      render: (_: unknown, record: LineItem) => (
        <strong><AmountDisplay amount={record.lineTotal} /></strong>
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

  const isPending = saveMutation.isPending || submitMutation.isPending

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}
        subtitle="Create or update a purchase order"
        actions={
          <Space>
            <Button onClick={() => navigate('/purchase/orders')} disabled={isPending}>
              Cancel
            </Button>
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
          <Col xs={24} sm={10}>
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
          <Col xs={24} sm={7}>
            <Form.Item
              name="orderDate"
              label="Order Date"
              rules={[{ required: true, message: 'Select order date' }]}
              initialValue={dayjs()}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={7}>
            <Form.Item name="expectedDeliveryDate" label="Expected Delivery">
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
          scroll={{ x: 900 }}
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
                  <Text type="secondary">GST Total</Text>
                  <Text><AmountDisplay amount={gstTotal} /></Text>
                </div>
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
