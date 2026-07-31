import { useState } from 'react'
import {
  Button,
  Select,
  Space,
  Table,
  DatePicker,
  InputNumber,
  message,
  Alert,
  Divider,
  Row,
  Col,
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import PageHeader from '../../components/PageHeader'
import { getWarehouses, createStockEntry } from '../../api/modules/inventory.api'
import { getItems } from '../../api/modules/catalog.api'
import type { CreateStockEntryRequest, StockEntryLine, StockEntryType } from '../../types/inventory.types'

const { Option } = Select

interface LineItem extends StockEntryLine {
  key: string
  itemName?: string
  mfgDateObj?: Dayjs | null
  expiryDateObj?: Dayjs | null
}

let lineCounter = 0
function newLine(): LineItem {
  return {
    key: String(++lineCounter),
    itemId: '',
    batchNo: '',
    mfgDate: undefined,
    expiryDate: undefined,
    mrp: undefined,
    qty: 1,
    rate: 0,
    mfgDateObj: null,
    expiryDateObj: null,
  }
}

export default function StockEntryPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [entryType, setEntryType] = useState<StockEntryType>('OPENING')
  const [warehouseId, setWarehouseId] = useState<string | undefined>()
  const [toWarehouseId, setToWarehouseId] = useState<string | undefined>()
  const [lines, setLines] = useState<LineItem[]>([newLine()])
  const [itemSearch, setItemSearch] = useState('')

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  })

  const { data: itemsData } = useQuery({
    queryKey: ['items-search', itemSearch],
    queryFn: () => getItems({ search: itemSearch, size: 50 }),
  })

  const mutation = useMutation({
    mutationFn: (payload: CreateStockEntryRequest) => createStockEntry(payload),
    onSuccess: () => {
      message.success('Stock entry created successfully')
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      navigate('/inventory/stock')
    },
    onError: () => {
      message.error('Failed to create stock entry')
    },
  })

  const addLine = () => {
    setLines((prev) => [...prev, newLine()])
  }

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key))
  }

  const updateLine = (key: string, updates: Partial<LineItem>) => {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...updates } : l)),
    )
  }

  const handleSubmit = () => {
    if (!warehouseId) {
      message.warning('Please select a warehouse')
      return
    }
    if (entryType === 'TRANSFER' && !toWarehouseId) {
      message.warning('Please select a destination warehouse')
      return
    }
    const validLines = lines.filter((l) => l.itemId && l.qty > 0)
    if (validLines.length === 0) {
      message.warning('Please add at least one valid line item')
      return
    }

    const payload: CreateStockEntryRequest = {
      entryType,
      warehouseId,
      toWarehouseId: entryType === 'TRANSFER' ? toWarehouseId : undefined,
      lines: validLines.map((l) => ({
        itemId: l.itemId,
        batchNo: l.batchNo || undefined,
        mfgDate: l.mfgDateObj?.format('YYYY-MM-DD'),
        expiryDate: l.expiryDateObj?.format('YYYY-MM-DD'),
        mrp: l.mrp,
        qty: l.qty,
        rate: l.rate,
      })),
    }
    mutation.mutate(payload)
  }

  const isBatchTracked = (itemId: string) => {
    const item = itemsData?.data.find((i) => i.id === itemId)
    return item?.trackingType === 'BATCH'
  }

  const columns: ColumnsType<LineItem> = [
    {
      title: 'Item',
      key: 'item',
      width: 220,
      render: (_, record) => (
        <Select
          showSearch
          placeholder="Search item"
          style={{ width: '100%' }}
          value={record.itemId || undefined}
          filterOption={false}
          onSearch={setItemSearch}
          onChange={(val) => {
            const found = itemsData?.data.find((i) => i.id === val)
            updateLine(record.key, {
              itemId: val,
              itemName: found ? (found.code ? `${found.code} - ${found.name}` : found.name) : undefined,
            })
          }}
        >
          {itemsData?.data.map((item) => (
            <Option key={item.id} value={item.id}>
              {item.code ? `${item.code} - ${item.name}` : item.name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Batch No',
      key: 'batchNo',
      width: 130,
      render: (_, record) => (
        <input
          className="ant-input"
          style={{
            width: '100%',
            padding: '4px 8px',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            fontSize: 14,
          }}
          placeholder="Batch No"
          value={record.batchNo ?? ''}
          disabled={record.itemId ? !isBatchTracked(record.itemId) : false}
          onChange={(e) => updateLine(record.key, { batchNo: e.target.value })}
        />
      ),
    },
    {
      title: 'Mfg Date',
      key: 'mfgDate',
      width: 140,
      render: (_, record) => (
        <DatePicker
          style={{ width: '100%' }}
          value={record.mfgDateObj ?? null}
          format="DD/MM/YYYY"
          disabled={record.itemId ? !isBatchTracked(record.itemId) : false}
          onChange={(d) => updateLine(record.key, { mfgDateObj: d })}
        />
      ),
    },
    {
      title: 'Expiry Date',
      key: 'expiryDate',
      width: 140,
      render: (_, record) => (
        <DatePicker
          style={{ width: '100%' }}
          value={record.expiryDateObj ?? null}
          format="DD/MM/YYYY"
          disabled={record.itemId ? !isBatchTracked(record.itemId) : false}
          disabledDate={(current) => current && current.toDate() < new Date()}
          onChange={(d) => updateLine(record.key, { expiryDateObj: d })}
        />
      ),
    },
    {
      title: 'MRP (₹)',
      key: 'mrp',
      width: 110,
      render: (_, record) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          step={0.01}
          precision={2}
          value={record.mrp}
          placeholder="0.00"
          onChange={(v) => updateLine(record.key, { mrp: v ?? undefined })}
        />
      ),
    },
    {
      title: 'Qty',
      key: 'qty',
      width: 90,
      render: (_, record) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0.001}
          step={1}
          value={record.qty}
          onChange={(v) => updateLine(record.key, { qty: v ?? 1 })}
        />
      ),
    },
    {
      title: 'Rate (₹)',
      key: 'rate',
      width: 110,
      render: (_, record) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          step={0.01}
          precision={2}
          value={record.rate}
          placeholder="0.00"
          onChange={(v) => updateLine(record.key, { rate: v ?? 0 })}
        />
      ),
    },
    {
      title: '',
      key: 'remove',
      width: 48,
      render: (_, record) => (
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
        title="Stock Entry"
        subtitle="Record opening stock, adjustments, or warehouse transfers"
      />

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>Entry Type</div>
          <Select
            value={entryType}
            onChange={(v) => setEntryType(v)}
            style={{ width: '100%' }}
          >
            <Option value="OPENING">Opening Stock</Option>
            <Option value="ADJUSTMENT">Adjustment</Option>
            <Option value="TRANSFER">Transfer</Option>
          </Select>
        </Col>
        <Col xs={24} sm={8}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>
            {entryType === 'TRANSFER' ? 'From Warehouse' : 'Warehouse'} *
          </div>
          <Select
            placeholder="Select warehouse"
            value={warehouseId}
            onChange={setWarehouseId}
            style={{ width: '100%' }}
            showSearch
            filterOption={(input, opt) =>
              String(opt?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {warehouses?.map((w) => (
              <Option key={w.id} value={w.id}>
                {w.name}
              </Option>
            ))}
          </Select>
        </Col>
        {entryType === 'TRANSFER' && (
          <Col xs={24} sm={8}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>To Warehouse *</div>
            <Select
              placeholder="Select destination warehouse"
              value={toWarehouseId}
              onChange={setToWarehouseId}
              style={{ width: '100%' }}
              showSearch
              filterOption={(input, opt) =>
                String(opt?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {warehouses
                ?.filter((w) => w.id !== warehouseId)
                .map((w) => (
                  <Option key={w.id} value={w.id}>
                    {w.name}
                  </Option>
                ))}
            </Select>
          </Col>
        )}
      </Row>

      {mutation.isError && (
        <Alert
          message="Failed to save stock entry. Please try again."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      <Divider orientation="left">Line Items</Divider>

      <Table<LineItem>
        columns={columns}
        dataSource={lines}
        pagination={false}
        rowKey="key"
        scroll={{ x: 900 }}
        size="small"
        style={{ marginBottom: 16 }}
      />

      <Space>
        <Button icon={<PlusOutlined />} onClick={addLine}>
          Add Line
        </Button>
      </Space>

      <Divider />

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={() => navigate('/inventory/stock')}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={mutation.isPending}
          >
            Save Stock Entry
          </Button>
        </Space>
      </div>
    </div>
  )
}
