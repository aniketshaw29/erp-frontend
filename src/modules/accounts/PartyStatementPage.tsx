import { useState, useCallback } from 'react'
import {
  Table,
  Button,
  Select,
  DatePicker,
  Space,
  Typography,
  Card,
  Tag,
  Badge,
  Row,
  Col,
  Descriptions,
  message,
  Empty,
  Modal,
} from 'antd'
import { SearchOutlined, MailOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import { getPartyStatement } from '../../api/modules/accounts.api'
import { getParties } from '../../api/modules/party.api'

const { Text } = Typography
const { RangePicker } = DatePicker

type DocType = 'INVOICE' | 'PAYMENT' | 'BILL' | 'CREDIT_NOTE' | string

const docTypeConfig: Record<string, { color: string; label: string }> = {
  INVOICE: { color: 'blue', label: 'Invoice' },
  PAYMENT: { color: 'green', label: 'Payment' },
  BILL: { color: 'orange', label: 'Bill' },
  CREDIT_NOTE: { color: 'red', label: 'Credit Note' },
}

interface PartyInfo {
  id: string
  name: string
  gstin?: string
  partyType: string
}

interface StatementRow {
  id: string
  date: string
  docNo: string
  docType: DocType
  description: string
  debit: number
  credit: number
  balance: number
}

interface PartyStatementData {
  party: PartyInfo
  openingBalance: number
  closingBalance: number
  entries: StatementRow[]
}

export default function PartyStatementPage() {
  const [selectedPartyId, setSelectedPartyId] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [loadParams, setLoadParams] = useState<{ partyId: string; from: string; to: string } | null>(null)

  const { data: partiesData } = useQuery({
    queryKey: ['parties-all'],
    queryFn: () => getParties({ size: 500 }).then((r) => r.data),
  })

  const parties = partiesData ?? []

  const { data: statementData, isLoading, isFetching } = useQuery<PartyStatementData>({
    queryKey: ['party-statement', loadParams],
    queryFn: () =>
      getPartyStatement(loadParams!.partyId, {
        from: loadParams!.from,
        to: loadParams!.to,
      }).then((r) => r.data.data ?? r.data),
    enabled: !!loadParams,
  })

  const handleLoad = useCallback(() => {
    if (!selectedPartyId) {
      message.warning('Please select a party')
      return
    }
    if (!dateRange) {
      message.warning('Please select a date range')
      return
    }
    setLoadParams({
      partyId: selectedPartyId,
      from: dateRange[0].format('YYYY-MM-DD'),
      to: dateRange[1].format('YYYY-MM-DD'),
    })
  }, [selectedPartyId, dateRange])

  const handleSendStatement = () => {
    Modal.info({
      title: 'Send Statement',
      content: 'Email feature coming soon.',
    })
  }

  const entries: StatementRow[] = statementData?.entries ?? []

  const columns: ColumnsType<StatementRow> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Doc No.',
      dataIndex: 'docNo',
      key: 'docNo',
      width: 130,
      render: (v: string) => <Text code>{v}</Text>,
    },
    {
      title: 'Doc Type',
      dataIndex: 'docType',
      key: 'docType',
      width: 120,
      render: (v: DocType) => {
        const cfg = docTypeConfig[v] ?? { color: 'default', label: v }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Debit',
      dataIndex: 'debit',
      key: 'debit',
      align: 'right',
      width: 130,
      render: (v: number) =>
        v > 0 ? <AmountDisplay amount={v} /> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Credit',
      dataIndex: 'credit',
      key: 'credit',
      align: 'right',
      width: 130,
      render: (v: number) =>
        v > 0 ? <AmountDisplay amount={v} /> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      align: 'right',
      width: 140,
      render: (v: number) => (
        <Text strong style={{ color: v < 0 ? '#cf1322' : 'inherit' }}>
          <AmountDisplay amount={Math.abs(v)} />
          {v < 0 ? ' Cr' : ' Dr'}
        </Text>
      ),
    },
  ]

  const closingBalance = statementData?.closingBalance ?? 0

  return (
    <div>
      <PageHeader
        title="Party Statement"
        subtitle="Account statement for customers and suppliers"
        actions={
          statementData ? (
            <Button icon={<MailOutlined />} onClick={handleSendStatement}>
              Send Statement
            </Button>
          ) : undefined
        }
      />

      <Card style={{ marginBottom: 24 }}>
        <Space wrap size={12}>
          <Select
            showSearch
            placeholder="Select party"
            value={selectedPartyId}
            onChange={setSelectedPartyId}
            style={{ minWidth: 260 }}
            optionFilterProp="label"
            options={parties.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
          />
          <RangePicker
            format="DD/MM/YYYY"
            value={dateRange}
            onChange={(vals) => setDateRange(vals as [Dayjs, Dayjs] | null)}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleLoad} loading={isFetching}>
            Load
          </Button>
        </Space>
      </Card>

      {statementData && (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} md={16}>
              <Card size="small">
                <Descriptions column={3} size="small">
                  <Descriptions.Item label="Party Name">
                    <Text strong>{statementData.party.name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="GSTIN">
                    {statementData.party.gstin ?? <Text type="secondary">N/A</Text>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Type">
                    <Tag>{statementData.party.partyType}</Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text type="secondary">Opening Balance</Text>
                  <Badge
                    count={<AmountDisplay amount={Math.abs(statementData.openingBalance)} />}
                    style={{ backgroundColor: statementData.openingBalance < 0 ? '#cf1322' : '#52c41a' }}
                    overflowCount={Infinity}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary">Closing Balance</Text>
                  <Text
                    strong
                    style={{
                      fontSize: 16,
                      color: closingBalance > 0 ? '#cf1322' : closingBalance < 0 ? '#52c41a' : 'inherit',
                    }}
                  >
                    <AmountDisplay amount={Math.abs(closingBalance)} />
                    {closingBalance !== 0 && (
                      <Text style={{ fontSize: 12, marginLeft: 4 }}>
                        {closingBalance > 0 ? '(Dr)' : '(Cr)'}
                      </Text>
                    )}
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          {entries.length === 0 ? (
            <Empty description="No transactions found for selected period" />
          ) : (
            <Table<StatementRow>
              dataSource={entries}
              columns={columns}
              rowKey="id"
              loading={isLoading}
              pagination={{ pageSize: 30 }}
              size="small"
              scroll={{ x: 900 }}
            />
          )}
        </>
      )}

      {!statementData && !isLoading && (
        <Empty description="Select a party and date range, then click Load" style={{ marginTop: 40 }} />
      )}
    </div>
  )
}
