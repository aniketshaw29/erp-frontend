import { useState } from 'react'
import {
  Button,
  Select,
  InputNumber,
  Typography,
  message,
  Row,
  Col,
  Card,
  Table,
  Upload,
  Badge,
  Space,
  Tag,
} from 'antd'
import {
  InboxOutlined,
  ReconciliationOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile, UploadProps } from 'antd/es/upload'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import { reconcileGstr2a } from '../../api/modules/gst.api'

const { Text, Title } = Typography
const { Dragger } = Upload

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

interface MatchedEntry {
  supplierGstin: string
  invoiceNo: string
  date: string
  ourAmount: number
  gstr2aAmount: number
  itcAvailable: number
}

interface In2aOnlyEntry {
  supplierGstin: string
  invoiceNo: string
  date: string
  value: number
  igst: number
  cgst: number
  sgst: number
}

interface InBooksOnlyEntry {
  billNo: string
  supplier: string
  date: string
  value: number
}

interface ReconcileResult {
  matched?: MatchedEntry[]
  in2aOnly?: In2aOnlyEntry[]
  inBooksOnly?: InBooksOnlyEntry[]
}

export default function Gstr2aPage() {
  const currentDate = dayjs()
  const [month, setMonth] = useState<number>(currentDate.month() + 1)
  const [year, setYear] = useState<number>(currentDate.year())
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [result, setResult] = useState<ReconcileResult | null>(null)

  const reconcileMutation = useMutation({
    mutationFn: () => reconcileGstr2a(month, year, fileContent!),
    onSuccess: (res) => {
      const data = res.data?.data ?? res.data
      setResult(data ?? {})
      message.success('Reconciliation complete')
    },
    onError: () => message.error('Reconciliation failed'),
  })

  const handleReconcile = () => {
    if (!fileContent) {
      message.warning('Please upload a GSTR-2A JSON file first')
      return
    }
    reconcileMutation.mutate()
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.json',
    fileList,
    beforeUpload: (file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFileContent(e.target?.result as string)
        message.success(`${file.name} loaded successfully`)
      }
      reader.onerror = () => message.error('Failed to read file')
      reader.readAsText(file)
      setFileList([file])
      return false
    },
    onRemove: () => {
      setFileList([])
      setFileContent(null)
    },
  }

  const matchedColumns: ColumnsType<MatchedEntry> = [
    { title: 'Supplier GSTIN', dataIndex: 'supplierGstin', key: 'supplierGstin', render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: 'Invoice No', dataIndex: 'invoiceNo', key: 'invoiceNo' },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '—' },
    { title: 'Our Amount', dataIndex: 'ourAmount', key: 'ourAmount', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: '2A Amount', dataIndex: 'gstr2aAmount', key: 'gstr2aAmount', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'ITC Available', dataIndex: 'itcAvailable', key: 'itcAvailable', align: 'right', render: (v: number) => <Text style={{ color: '#52c41a' }}><AmountDisplay amount={v ?? 0} /></Text> },
  ]

  const in2aOnlyColumns: ColumnsType<In2aOnlyEntry> = [
    { title: 'Supplier GSTIN', dataIndex: 'supplierGstin', key: 'supplierGstin', render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: 'Invoice No', dataIndex: 'invoiceNo', key: 'invoiceNo' },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '—' },
    { title: 'Value', dataIndex: 'value', key: 'value', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'IGST', dataIndex: 'igst', key: 'igst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'CGST', dataIndex: 'cgst', key: 'cgst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'SGST', dataIndex: 'sgst', key: 'sgst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Button size="small" type="dashed" disabled>
          Create Purchase Bill
        </Button>
      ),
    },
  ]

  const inBooksOnlyColumns: ColumnsType<InBooksOnlyEntry> = [
    { title: 'Bill No', dataIndex: 'billNo', key: 'billNo', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Supplier', dataIndex: 'supplier', key: 'supplier' },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '—' },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      align: 'right',
      render: (v: number) => (
        <Text style={{ color: '#ff4d4f' }}>
          <AmountDisplay amount={v ?? 0} />
        </Text>
      ),
    },
  ]

  const matched = result?.matched ?? []
  const in2aOnly = result?.in2aOnly ?? []
  const inBooksOnly = result?.inBooksOnly ?? []

  return (
    <div>
      <PageHeader
        title="GSTR-2A Reconciliation"
        subtitle="Match your purchase records with supplier-filed GSTR-2A data"
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
        </Row>

        <div style={{ marginTop: 16 }}>
          <Dragger {...uploadProps} style={{ maxWidth: 600 }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Drop your GSTR-2A JSON file here or click to browse</p>
            <p className="ant-upload-hint">
              Accept .json files downloaded from the GST portal
            </p>
          </Dragger>
        </div>

        <div style={{ marginTop: 16 }}>
          <Button
            type="primary"
            icon={<ReconciliationOutlined />}
            onClick={handleReconcile}
            loading={reconcileMutation.isPending}
            disabled={!fileContent}
          >
            Reconcile
          </Button>
        </div>
      </Card>

      {result && (
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <Text strong>Matched</Text>
                <Badge count={matched.length} style={{ backgroundColor: '#52c41a' }} />
              </Space>
            }
          >
            {matched.length > 0 ? (
              <Table<MatchedEntry>
                columns={matchedColumns}
                dataSource={matched}
                rowKey={(r) => `${r.supplierGstin}-${r.invoiceNo}`}
                pagination={{ pageSize: 20, showSizeChanger: true }}
                scroll={{ x: 'max-content' }}
                size="small"
              />
            ) : (
              <Text type="secondary">No matched entries found</Text>
            )}
          </Card>

          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#faad14' }} />
                <Text strong>In 2A Only</Text>
                <Badge count={in2aOnly.length} style={{ backgroundColor: '#faad14' }} />
                <Tag color="orange" style={{ fontWeight: 400, fontSize: 11 }}>
                  Supplier filed but you haven't booked
                </Tag>
              </Space>
            }
          >
            {in2aOnly.length > 0 ? (
              <Table<In2aOnlyEntry>
                columns={in2aOnlyColumns}
                dataSource={in2aOnly}
                rowKey={(r) => `${r.supplierGstin}-${r.invoiceNo}`}
                pagination={{ pageSize: 20, showSizeChanger: true }}
                scroll={{ x: 'max-content' }}
                size="small"
              />
            ) : (
              <Text type="secondary">No unbooked entries</Text>
            )}
          </Card>

          <Card
            title={
              <Space>
                <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                <Text strong>In Books Only</Text>
                <Badge count={inBooksOnly.length} style={{ backgroundColor: '#ff4d4f' }} />
                <Tag color="red" style={{ fontWeight: 400, fontSize: 11 }}>
                  ITC at risk — supplier hasn't filed
                </Tag>
              </Space>
            }
          >
            {inBooksOnly.length > 0 ? (
              <Table<InBooksOnlyEntry>
                columns={inBooksOnlyColumns}
                dataSource={inBooksOnly}
                rowKey={(r) => r.billNo}
                pagination={{ pageSize: 20, showSizeChanger: true }}
                scroll={{ x: 'max-content' }}
                size="small"
              />
            ) : (
              <Text type="secondary">No unmatched book entries</Text>
            )}
          </Card>
        </Space>
      )}
    </div>
  )
}
