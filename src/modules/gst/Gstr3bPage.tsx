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
} from 'antd'
import { CalculatorOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import { getGstr3bSummary } from '../../api/modules/gst.api'

const { Text, Title } = Typography

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

interface OutwardRow {
  nature: string
  taxableValue: number
  igst: number
  cgst: number
  sgst: number
}

interface ItcRow {
  itcType: string
  igst: number
  cgst: number
  sgst: number
}

interface Gstr3bData {
  outwardSupplies?: OutwardRow[]
  itc?: ItcRow[]
  netTaxPayable?: {
    igst: number
    cgst: number
    sgst: number
    total: number
  }
}

export default function Gstr3bPage() {
  const currentDate = dayjs()
  const [month, setMonth] = useState<number>(currentDate.month() + 1)
  const [year, setYear] = useState<number>(currentDate.year())
  const [queryParams, setQueryParams] = useState<{ month: number; year: number } | null>(null)

  const { data: summaryData, isFetching } = useQuery({
    queryKey: ['gstr3b-summary', queryParams?.month, queryParams?.year],
    queryFn: () => getGstr3bSummary(queryParams!.month, queryParams!.year).then((r) => r.data),
    enabled: !!queryParams,
  })

  const handleCompute = () => {
    if (!month || !year) {
      message.warning('Select month and year')
      return
    }
    setQueryParams({ month, year })
  }

  const gstr3b: Gstr3bData = summaryData?.data ?? summaryData ?? {}

  const outwardRows: OutwardRow[] = gstr3b.outwardSupplies ?? []
  const totalOutward: OutwardRow = {
    nature: 'Total',
    taxableValue: outwardRows.reduce((s, r) => s + (r.taxableValue ?? 0), 0),
    igst: outwardRows.reduce((s, r) => s + (r.igst ?? 0), 0),
    cgst: outwardRows.reduce((s, r) => s + (r.cgst ?? 0), 0),
    sgst: outwardRows.reduce((s, r) => s + (r.sgst ?? 0), 0),
  }

  const outwardColumns: ColumnsType<OutwardRow> = [
    {
      title: 'Nature',
      dataIndex: 'nature',
      key: 'nature',
      render: (v: string, _record, idx) => {
        const isTotal = idx === outwardRows.length
        return isTotal ? <Text strong>{v}</Text> : <Text>{v}</Text>
      },
    },
    { title: 'Taxable Value', dataIndex: 'taxableValue', key: 'taxableValue', align: 'right', render: (v: number, _r, idx) => idx === outwardRows.length ? <Text strong><AmountDisplay amount={v ?? 0} /></Text> : <AmountDisplay amount={v ?? 0} /> },
    { title: 'IGST', dataIndex: 'igst', key: 'igst', align: 'right', render: (v: number, _r, idx) => idx === outwardRows.length ? <Text strong><AmountDisplay amount={v ?? 0} /></Text> : <AmountDisplay amount={v ?? 0} /> },
    { title: 'CGST', dataIndex: 'cgst', key: 'cgst', align: 'right', render: (v: number, _r, idx) => idx === outwardRows.length ? <Text strong><AmountDisplay amount={v ?? 0} /></Text> : <AmountDisplay amount={v ?? 0} /> },
    { title: 'SGST', dataIndex: 'sgst', key: 'sgst', align: 'right', render: (v: number, _r, idx) => idx === outwardRows.length ? <Text strong><AmountDisplay amount={v ?? 0} /></Text> : <AmountDisplay amount={v ?? 0} /> },
  ]

  const itcColumns: ColumnsType<ItcRow> = [
    { title: 'ITC Type', dataIndex: 'itcType', key: 'itcType' },
    { title: 'IGST', dataIndex: 'igst', key: 'igst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'CGST', dataIndex: 'cgst', key: 'cgst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
    { title: 'SGST', dataIndex: 'sgst', key: 'sgst', align: 'right', render: (v: number) => <AmountDisplay amount={v ?? 0} /> },
  ]

  const net = gstr3b.netTaxPayable

  return (
    <div>
      <PageHeader
        title="GSTR-3B — Monthly Summary Return"
        subtitle="Self-declared summary return for outward supplies and input tax credit"
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
              icon={<CalculatorOutlined />}
              onClick={handleCompute}
              loading={isFetching}
            >
              Compute
            </Button>
          </Col>
        </Row>
      </Card>

      {summaryData && (
        <Row gutter={24}>
          <Col xs={24}>
            <Card
              title={<Text strong>3.1 — Outward Supplies and Inward Supplies Liable to Reverse Charge</Text>}
              style={{ marginBottom: 24 }}
            >
              <Table<OutwardRow>
                columns={outwardColumns}
                dataSource={[...outwardRows, totalOutward]}
                rowKey={(r, idx) => `outward-${idx ?? r.nature}`}
                pagination={false}
                size="small"
                rowClassName={(_record, idx) =>
                  idx === outwardRows.length ? 'ant-table-row-selected' : ''
                }
              />
            </Card>

            <Card
              title={<Text strong>4 — Eligible ITC</Text>}
              style={{ marginBottom: 24 }}
            >
              <Table<ItcRow>
                columns={itcColumns}
                dataSource={gstr3b.itc ?? []}
                rowKey={(r) => r.itcType}
                pagination={false}
                size="small"
              />
            </Card>

            {net && (
              <Card
                style={{
                  marginBottom: 24,
                  background: 'linear-gradient(135deg, #f6ffed 0%, #fffbe6 100%)',
                  border: '1px solid #b7eb8f',
                }}
              >
                <Title level={5} style={{ marginTop: 0, marginBottom: 20 }}>
                  Net Tax Payable
                </Title>
                <Row gutter={[24, 16]}>
                  <Col xs={24} sm={6}>
                    <Card size="small" style={{ textAlign: 'center', background: 'rgba(255,255,255,0.7)' }}>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>IGST Payable</Text>
                      <Text style={{ fontSize: 20, fontWeight: 700 }}>
                        <AmountDisplay amount={net.igst ?? 0} />
                      </Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card size="small" style={{ textAlign: 'center', background: 'rgba(255,255,255,0.7)' }}>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>CGST Payable</Text>
                      <Text style={{ fontSize: 20, fontWeight: 700 }}>
                        <AmountDisplay amount={net.cgst ?? 0} />
                      </Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card size="small" style={{ textAlign: 'center', background: 'rgba(255,255,255,0.7)' }}>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>SGST Payable</Text>
                      <Text style={{ fontSize: 20, fontWeight: 700 }}>
                        <AmountDisplay amount={net.sgst ?? 0} />
                      </Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card
                      size="small"
                      style={{
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.9)',
                        border: '2px solid #52c41a',
                      }}
                    >
                      <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Total Tax Payable</Text>
                      <Text style={{ fontSize: 22, fontWeight: 800, color: '#389e0d' }}>
                        <AmountDisplay amount={net.total ?? 0} />
                      </Text>
                    </Card>
                  </Col>
                </Row>
              </Card>
            )}
          </Col>
        </Row>
      )}
    </div>
  )
}
