import { useState } from 'react'
import {
  Button,
  Tabs,
  Table,
  Select,
  InputNumber,
  Space,
  Typography,
  Tooltip,
  message,
  Row,
  Col,
  Card,
} from 'antd'
import {
  DownloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import { getGstr1Summary, downloadGstr1Json } from '../../api/modules/gst.api'

const { Text } = Typography

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

interface B2bRow {
  buyerGstin: string
  buyerName: string
  invoiceCount: number
  taxableValue: number
  cgst: number
  sgst: number
  igst: number
  totalTax: number
}

interface B2cRow {
  state: string
  taxableValue: number
  igstLarge: number
  cgst: number
  sgst: number
}

interface CreditNoteRow {
  cnNo: string
  cnDate: string
  buyerGstin: string
  value: number
  cgst: number
  sgst: number
  igst: number
}

interface HsnRow {
  hsnCode: string
  description: string
  uqc: string
  qty: number
  taxableValue: number
  cgst: number
  sgst: number
  igst: number
}

interface Gstr1Data {
  b2b?: B2bRow[]
  b2c?: B2cRow[]
  creditNotes?: CreditNoteRow[]
  hsn?: HsnRow[]
}

export default function Gstr1Page() {
  const currentDate = dayjs()
  const [month, setMonth] = useState<number>(currentDate.month() + 1)
  const [year, setYear] = useState<number>(currentDate.year())
  const [queryParams, setQueryParams] = useState<{ month: number; year: number } | null>(null)
  const [downloadingJson, setDownloadingJson] = useState(false)

  const { data: summaryData, isFetching } = useQuery({
    queryKey: ['gstr1-summary', queryParams?.month, queryParams?.year],
    queryFn: () => getGstr1Summary(queryParams!.month, queryParams!.year).then((r) => r.data),
    enabled: !!queryParams,
  })

  const handleLoad = () => {
    if (!month || !year) {
      message.warning('Select month and year')
      return
    }
    setQueryParams({ month, year })
  }

  const handleDownloadJson = async () => {
    if (!queryParams) return
    setDownloadingJson(true)
    try {
      const res = await downloadGstr1Json(queryParams.month, queryParams.year)
      const blob = new Blob([res.data as BlobPart], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `GSTR1_${queryParams.month.toString().padStart(2, '0')}_${queryParams.year}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      message.error('Failed to download GSTR-1 JSON')
    } finally {
      setDownloadingJson(false)
    }
  }

  const gstr1: Gstr1Data = summaryData?.data ?? summaryData ?? {}

  const b2bColumns: ColumnsType<B2bRow> = [
    { title: 'Buyer GSTIN', dataIndex: 'buyerGstin', key: 'buyerGstin', render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: 'Buyer Name', dataIndex: 'buyerName', key: 'buyerName' },
    { title: 'Invoice Count', dataIndex: 'invoiceCount', key: 'invoiceCount', align: 'right' },
    { title: 'Taxable Value', dataIndex: 'taxableValue', key: 'taxableValue', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'CGST', dataIndex: 'cgst', key: 'cgst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'SGST', dataIndex: 'sgst', key: 'sgst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'IGST', dataIndex: 'igst', key: 'igst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'Total Tax', dataIndex: 'totalTax', key: 'totalTax', align: 'right', render: (v: number) => <Text strong><AmountDisplay amount={v ?? 0} /></Text> },
  ]

  const b2cColumns: ColumnsType<B2cRow> = [
    { title: 'State', dataIndex: 'state', key: 'state' },
    { title: 'Taxable Value', dataIndex: 'taxableValue', key: 'taxableValue', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'IGST (Large)', dataIndex: 'igstLarge', key: 'igstLarge', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'CGST', dataIndex: 'cgst', key: 'cgst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'SGST', dataIndex: 'sgst', key: 'sgst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
  ]

  const cnColumns: ColumnsType<CreditNoteRow> = [
    { title: 'CN No', dataIndex: 'cnNo', key: 'cnNo', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'CN Date', dataIndex: 'cnDate', key: 'cnDate', render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '—' },
    { title: 'Buyer GSTIN', dataIndex: 'buyerGstin', key: 'buyerGstin', render: (v: string) => <Text code style={{ fontSize: 11 }}>{v ?? '—'}</Text> },
    { title: 'Value', dataIndex: 'value', key: 'value', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'CGST', dataIndex: 'cgst', key: 'cgst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'SGST', dataIndex: 'sgst', key: 'sgst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'IGST', dataIndex: 'igst', key: 'igst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
  ]

  const hsnColumns: ColumnsType<HsnRow> = [
    { title: 'HSN Code', dataIndex: 'hsnCode', key: 'hsnCode', render: (v: string) => <Text code>{v}</Text> },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'UQC', dataIndex: 'uqc', key: 'uqc' },
    { title: 'Qty', dataIndex: 'qty', key: 'qty', align: 'right' },
    { title: 'Taxable Value', dataIndex: 'taxableValue', key: 'taxableValue', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'CGST', dataIndex: 'cgst', key: 'cgst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'SGST', dataIndex: 'sgst', key: 'sgst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'IGST', dataIndex: 'igst', key: 'igst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
  ]

  const tabItems = [
    {
      key: 'b2b',
      label: 'B2B',
      children: (
        <Table<B2bRow>
          columns={b2bColumns}
          dataSource={gstr1.b2b ?? []}
          rowKey={(r) => r.buyerGstin}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      ),
    },
    {
      key: 'b2c',
      label: 'B2C',
      children: (
        <Table<B2cRow>
          columns={b2cColumns}
          dataSource={gstr1.b2c ?? []}
          rowKey={(r) => r.state}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      ),
    },
    {
      key: 'creditnotes',
      label: 'Credit Notes',
      children: (
        <Table<CreditNoteRow>
          columns={cnColumns}
          dataSource={gstr1.creditNotes ?? []}
          rowKey={(r) => r.cnNo}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      ),
    },
    {
      key: 'hsn',
      label: 'HSN Summary',
      children: (
        <Table<HsnRow>
          columns={hsnColumns}
          dataSource={gstr1.hsn ?? []}
          rowKey={(r) => r.hsnCode}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="GSTR-1 — Outward Supply Return"
        subtitle="Monthly return of outward supplies of goods or services"
      />

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text type="secondary" style={{ marginRight: 8 }}>Period:</Text>
          </Col>
          <Col>
            <Select
              value={month}
              onChange={setMonth}
              options={MONTHS}
              style={{ width: 140 }}
              placeholder="Month"
            />
          </Col>
          <Col>
            <InputNumber
              value={year}
              onChange={(v) => setYear(v ?? dayjs().year())}
              min={2017}
              max={dayjs().year() + 1}
              precision={0}
              style={{ width: 100 }}
              placeholder="Year"
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleLoad}
              loading={isFetching}
            >
              Load
            </Button>
          </Col>
        </Row>
      </Card>

      {summaryData && (
        <>
          <Tabs items={tabItems} style={{ marginBottom: 16 }} />

          <Card>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadJson}
                loading={downloadingJson}
                type="primary"
                ghost
              >
                Download JSON
              </Button>
              <Tooltip title="Coming soon">
                <Button icon={<DownloadOutlined />} disabled>
                  Download Excel
                </Button>
              </Tooltip>
            </Space>
          </Card>
        </>
      )}
    </div>
  )
}
