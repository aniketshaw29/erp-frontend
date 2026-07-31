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
import { getWarehouses } from '../../api/modules/inventory.api'
import {
  getPurchaseOrders,
  getPurchaseOrder,
  createGrn,
  submitGrn,
} from '../../api/modules/purchase.api'
import type { GrnLine } from '../../types/purchase.types'

const { Title, Text } = Typography

interface GrnLineItem {
  key: string
  itemId: string
  itemName: string
  itemCode: string
  poLineId?: string
  batchNo: string
  mfgDate?: string
  expiryDate?: string
  mrp: number
  qty: number
  rate: number
  discount: number
  gstRate: number
  taxableAmount: number
  gstAmount: number
  lineTotal: number
}

function calcLine(item: Partial<GrnLineItem>): Partial<GrnLineItem> {
  const qty = item.qty ?? 0
  const rate = item.rate ?? 0
  const discount = item.discount ?? 0
  const gstRate = item.gstRate ?? 0
  const taxableAmount = qty * rate * (1 - discount / 100)
  const gstAmount = taxableAmount * (gstRate / 100)
  return { ...item, taxableAmount, gstAmount, lineTotal: taxableAmount + gstAmount }
}

function newLine(): GrnLineItem {
  return {
    key: `${Date.now()}-${Math.random()}`,
    itemId: '',
    itemName: '',
    itemCode: '',
    batchNo: '',
    mrp: 0,
    qty: 1,
    rate: 0,
    discount: 0,
    gstRate: 0,
    taxableAmount: 0,
    gstAmount: 0,
    lineTotal: 0,
  }
}

export default function GrnFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [lines, setLines] = useState<GrnLineItem[]>([newLine()])

  const { data: partiesData } = useQuery({
    queryKey: ['parties-vendors'],
    queryFn: () => getParties({ size: 200, partyType: 'VENDOR' }).then((r) => r.data),
  })

  const { data: itemsData } = useQuery({
    queryKey: ['items-for-grn'],
    queryFn: () => getItems({ size: 200 }).then((r) => r.data),
  })

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  })

  const { data: openPOsData } = useQuery({
    queryKey: ['open-purchase-orders'],
    queryFn: () =>
      getPurchaseOrders({ size: 100, status: 'SUBMITTED' }).then((r) => r.data),
  })

  const handlePoSelect = async (poId: string) => {
    if (!poId) {
      setLines([newLine()])
      form.setFieldValue('supplierId', undefined)
      return
    }
    try {
      const res = await getPurchaseOrder(poId)
      const po = res.data.data
      form.setFieldValue('supplierId', po.supplierId)
      setLines(
        po.lines.map((l) => ({
          key: l.id,
          itemId: l.itemId,
          itemName: l.itemName,
          itemCode: l.itemCode,
          poLineId: l.id,
          batchNo: '',
          mrp: 0,
          qty: l.qty - (l.receivedQty ?? 0),
          rate: l.rate,
          discount: l.discount ?? 0,
          gstRate: l.gstRate,
          taxableAmount: l.taxableAmount,
          gstAmount: l.gstAmount,
          lineTotal: l.lineTotal,
        })),
      )
    } catch {
      message.error('Failed to load PO details')
    }
  }

  const buildPayload = async () => {
    const values = await form.validateFields()
    const grnLines: Omit<GrnLine, 'id'>[] = lines
      .filter((l) => l.itemId)
      .map((l) => ({
        itemId: l.itemId,
        itemName: l.itemName,
        itemCode: l.itemCode,
        poLineId: l.poLineId,
        batchNo: l.batchNo || undefined,
        mfgDate: l.mfgDate,
        expiryDate: l.expiryDate,
        mrp: l.mrp,
        qty: l.qty,
        rate: l.rate,
        discount: l.discount,
        gstRate: l.gstRate,
        taxableAmount: l.taxableAmount,
        gstAmount: l.gstAmount,
        lineTotal: l.lineTotal,
      }))

    if (grnLines.length === 0) {
      message.warning('Add at least one line item')
      return null
    }

    const subtotal = lines.reduce((s, l) => s + l.taxableAmount, 0)
    const totalGst = lines.reduce((s, l) => s + l.gstAmount, 0)
    const supplier = partiesData?.find((p) => p.id === values.supplierId)
    const warehouse = warehousesData?.find((w) => w.id === values.warehouseId)

    return {
      poId: values.poId || undefined,
      poNumber: openPOsData?.data?.find((p) => p.id === values.poId)?.poNumber,
      supplierId: values.supplierId,
      supplierName: supplier?.name ?? '',
      warehouseId: values.warehouseId,
      warehouseName: warehouse?.name ?? '',
      receiptDate: values.receiptDate.format('YYYY-MM-DD'),
      supplierDocNo: values.supplierDocNo,
      notes: values.notes,
      lines: grnLines,
      subtotal,
      totalGst,
      grandTotal: subtotal + totalGst,
      status: 'DRAFT',
    }
  }

  const saveMutation = useMutation({
    mutationFn: (payload: any) => createGrn(payload),
    onSuccess: () => {
      message.success('GRN saved as draft')
      queryClient.invalidateQueries({ queryKey: ['grns'] })
      navigate('/purchase/grn')
    },
    onError: () => message.error('Failed to save GRN'),
  })

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await createGrn(payload)
      const grnId = res.data.data.id
      await submitGrn(grnId)
    },
    onSuccess: () => {
      message.success('GRN submitted — stock updated')
      queryClient.invalidateQueries({ queryKey: ['grns'] })
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      navigate('/purchase/grn')
    },
    onError: () => message.error('Failed to submit GRN'),
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

  const removeLine = (key: string) =>
    setLines((prev) => prev.filter((l) => l.key !== key))

  const updateLine = (key: string, field: keyof GrnLineItem, value: any) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l
        const updated = { ...l, [field]: value }
        if (field === 'itemId') {
          const item = itemsData?.find((i) => i.id === value)
          if (item) {
            updated.itemName = item.name
            updated.itemCode = item.code
            updated.gstRate = item.gstRate
            updated.rate = item.purchaseRate || item.standardRate
            updated.mrp = item.mrp
          }
        }
        return calcLine(updated) as GrnLineItem
      }),
    )
  }

  const taxableTotal = lines.reduce((s, l) => s + l.taxableAmount, 0)
  const gstTotal = lines.reduce((s, l) => s + l.gstAmount, 0)
  const grandTotal = taxableTotal + gstTotal
  const isPending = saveMutation.isPending || submitMutation.isPending

  const lineColumns = [
    {
      title: 'Item',
      key: 'itemId',
      width: 220,
      render: (_: unknown, record: GrnLineItem) => (
        <Select
          showSearch
          placeholder="Select item"
          value={record.itemId || undefined}
          onChange={(val) => updateLine(record.key, 'itemId', val as string)}
          style={{ width: '100%' }}
          optionFilterProp="label"
          options={itemsData?.map((i) => ({ value: i.id, label: `${i.code} — ${i.name}` }))}
          disabled={!!record.poLineId}
        />
      ),
    },
    {
      title: 'Batch No',
      key: 'batchNo',
      width: 110,
      render: (_: unknown, record: GrnLineItem) => (
        <Input
          value={record.batchNo}
          onChange={(e) => updateLine(record.key, 'batchNo', e.target.value)}
          placeholder="Batch"
        />
      ),
    },
    {
      title: 'Mfg Date',
      key: 'mfgDate',
      width: 130,
      render: (_: unknown, record: GrnLineItem) => (
        <DatePicker
          format="DD/MM/YYYY"
          value={record.mfgDate ? dayjs(record.mfgDate) : undefined}
          onChange={(d) => updateLine(record.key, 'mfgDate', d?.format('YYYY-MM-DD'))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Expiry Date',
      key: 'expiryDate',
      width: 130,
      render: (_: unknown, record: GrnLineItem) => (
        <DatePicker
          format="DD/MM/YYYY"
          value={record.expiryDate ? dayjs(record.expiryDate) : undefined}
          onChange={(d) => updateLine(record.key, 'expiryDate', d?.format('YYYY-MM-DD'))}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'MRP',
      key: 'mrp',
      width: 100,
      render: (_: unknown, record: GrnLineItem) => (
        <InputNumber
          min={0}
          precision={2}
          value={record.mrp}
          onChange={(val) => updateLine(record.key, 'mrp', val ?? 0)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Qty',
      key: 'qty',
      width: 90,
      render: (_: unknown, record: GrnLineItem) => (
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
      width: 100,
      render: (_: unknown, record: GrnLineItem) => (
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
      title: 'Total',
      key: 'lineTotal',
      align: 'right' as const,
      width: 120,
      render: (_: unknown, record: GrnLineItem) => (
        <strong><AmountDisplay amount={record.lineTotal} /></strong>
      ),
    },
    {
      title: '',
      key: 'remove',
      width: 44,
      render: (_: unknown, record: GrnLineItem) => (
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
        title="New GRN"
        subtitle="Record goods receipt"
        actions={
          <Space>
            <Button onClick={() => navigate('/purchase/grn')} disabled={isPending}>
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
              Submit &amp; Credit Stock
            </Button>
          </Space>
        }
      />

      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="poId" label="Link to Purchase Order (optional)">
              <Select
                showSearch
                allowClear
                placeholder="Select PO"
                optionFilterProp="label"
                onChange={handlePoSelect}
                options={openPOsData?.data?.map((p) => ({
                  value: p.id,
                  label: `${p.poNumber} — ${p.supplierName}`,
                }))}
              />
            </Form.Item>
          </Col>
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
                options={partiesData?.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="warehouseId"
              label="Warehouse"
              rules={[{ required: true, message: 'Select warehouse' }]}
            >
              <Select
                placeholder="Select warehouse"
                options={warehousesData?.map((w) => ({ value: w.id, label: w.name }))}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="receiptDate"
              label="Receipt Date"
              rules={[{ required: true, message: 'Select receipt date' }]}
              initialValue={dayjs()}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="supplierDocNo" label="Supplier Doc No">
              <Input placeholder="Supplier's delivery challan no." />
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
          scroll={{ x: 1100 }}
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
