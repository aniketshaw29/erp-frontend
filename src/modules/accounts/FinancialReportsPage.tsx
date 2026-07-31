import React, { useState } from 'react'
import {
  Table,
  Button,
  DatePicker,
  Typography,
  Card,
  Row,
  Col,
  Tag,
  Space,
  Divider,
  Statistic,
  List,
  Empty,
  Spin,
} from 'antd'
import {
  BarChartOutlined,
  LineChartOutlined,
  FundOutlined,
  SwapOutlined,
  BookOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import {
  getTrialBalance,
  getProfitLoss,
  getBalanceSheet,
  getCashFlow,
  getDayBook,
} from '../../api/modules/accounts.api'

const { Text, Title } = Typography
const { RangePicker } = DatePicker

// ── Report types ──────────────────────────────────────────────────────────────

type ReportType = 'trial-balance' | 'profit-loss' | 'balance-sheet' | 'cash-flow' | 'day-book'

interface ReportCard {
  key: ReportType
  label: string
  icon: React.ReactNode
  description: string
}

const reportCards: ReportCard[] = [
  {
    key: 'trial-balance',
    label: 'Trial Balance',
    icon: <BarChartOutlined style={{ fontSize: 20 }} />,
    description: 'Debit and credit balances for all accounts',
  },
  {
    key: 'profit-loss',
    label: 'Profit & Loss',
    icon: <LineChartOutlined style={{ fontSize: 20 }} />,
    description: 'Income, expenses and net profit/loss',
  },
  {
    key: 'balance-sheet',
    label: 'Balance Sheet',
    icon: <FundOutlined style={{ fontSize: 20 }} />,
    description: 'Assets, liabilities and equity snapshot',
  },
  {
    key: 'cash-flow',
    label: 'Cash Flow',
    icon: <SwapOutlined style={{ fontSize: 20 }} />,
    description: 'Operating, investing and financing activities',
  },
  {
    key: 'day-book',
    label: 'Day Book',
    icon: <BookOutlined style={{ fontSize: 20 }} />,
    description: 'All transactions for a specific date',
  },
]

// ── Trial Balance ─────────────────────────────────────────────────────────────

interface TrialBalanceRow {
  id: string
  code: string
  accountName: string
  accountType: string
  debitBalance: number
  creditBalance: number
}

function TrialBalanceReport() {
  const [asOf, setAsOf] = useState<Dayjs | null>(dayjs())
  const [trigger, setTrigger] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['trial-balance', trigger],
    queryFn: () => getTrialBalance(trigger!).then((r) => r.data.data ?? r.data),
    enabled: !!trigger,
  })

  const rows: TrialBalanceRow[] = data?.rows ?? data ?? []

  const totalDebit = rows.reduce((s, r) => s + (r.debitBalance ?? 0), 0)
  const totalCredit = rows.reduce((s, r) => s + (r.creditBalance ?? 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  const groupedRows: TrialBalanceRow[] = []
  const types = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']
  types.forEach((type) => {
    const typeRows = rows.filter((r) => r.accountType === type)
    if (typeRows.length > 0) {
      groupedRows.push(...typeRows)
      groupedRows.push({
        id: `subtotal-${type}`,
        code: '',
        accountName: `Total ${type}`,
        accountType: type,
        debitBalance: typeRows.reduce((s, r) => s + (r.debitBalance ?? 0), 0),
        creditBalance: typeRows.reduce((s, r) => s + (r.creditBalance ?? 0), 0),
      })
    }
  })

  const columns: ColumnsType<TrialBalanceRow> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 80,
      render: (v: string, row) =>
        row.id.startsWith('subtotal-') ? null : <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Account Name',
      dataIndex: 'accountName',
      key: 'accountName',
      render: (v: string, row) =>
        row.id.startsWith('subtotal-') ? (
          <Text strong style={{ color: '#555' }}>{v}</Text>
        ) : v,
    },
    {
      title: 'Type',
      dataIndex: 'accountType',
      key: 'accountType',
      width: 100,
      render: (v: string, row) =>
        row.id.startsWith('subtotal-') ? null : <Tag style={{ fontSize: 11 }}>{v}</Tag>,
    },
    {
      title: 'Debit Balance',
      dataIndex: 'debitBalance',
      key: 'debitBalance',
      align: 'right',
      width: 150,
      render: (v: number, row) =>
        v > 0 ? (
          <Text strong={row.id.startsWith('subtotal-')}>
            <AmountDisplay amount={v} />
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Credit Balance',
      dataIndex: 'creditBalance',
      key: 'creditBalance',
      align: 'right',
      width: 150,
      render: (v: number, row) =>
        v > 0 ? (
          <Text strong={row.id.startsWith('subtotal-')}>
            <AmountDisplay amount={v} />
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ]

  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <DatePicker
          value={asOf}
          onChange={setAsOf}
          format="DD/MM/YYYY"
          placeholder="As of date"
        />
        <Button
          type="primary"
          onClick={() => setTrigger(asOf?.format('YYYY-MM-DD') ?? null)}
          disabled={!asOf}
        >
          Generate
        </Button>
      </Space>

      {isLoading && <Spin />}
      {!isLoading && trigger && rows.length === 0 && <Empty description="No data" />}
      {rows.length > 0 && (
        <>
          <Table<TrialBalanceRow>
            dataSource={groupedRows}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
            rowClassName={(row) =>
              row.id.startsWith('subtotal-') ? 'trial-balance-subtotal-row' : ''
            }
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} />
                <Table.Summary.Cell index={1}>
                  <Text strong>Grand Total</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  {isBalanced ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>Balanced</Tag>
                  ) : (
                    <Tag color="error" icon={<CloseCircleOutlined />}>Out of Balance</Tag>
                  )}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Text strong><AmountDisplay amount={totalDebit} /></Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <Text strong><AmountDisplay amount={totalCredit} /></Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </>
      )}
    </div>
  )
}

// ── Profit & Loss ─────────────────────────────────────────────────────────────

interface PLRow {
  accountId: string
  accountName: string
  amount: number
}

interface PLData {
  income: PLRow[]
  expenses: PLRow[]
  totalIncome: number
  totalExpenses: number
  netProfit: number
}

function ProfitLossReport() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().startOf('month'),
    dayjs(),
  ])
  const [trigger, setTrigger] = useState<{ from: string; to: string } | null>(null)

  const { data, isLoading } = useQuery<PLData>({
    queryKey: ['profit-loss', trigger],
    queryFn: () =>
      getProfitLoss(trigger!.from, trigger!.to).then((r) => r.data.data ?? r.data),
    enabled: !!trigger,
  })

  const income = data?.income ?? []
  const expenses = data?.expenses ?? []
  const totalIncome = data?.totalIncome ?? income.reduce((s, r) => s + r.amount, 0)
  const totalExpenses = data?.totalExpenses ?? expenses.reduce((s, r) => s + r.amount, 0)
  const netProfit = data?.netProfit ?? totalIncome - totalExpenses
  const isProfit = netProfit >= 0

  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <RangePicker
          value={dateRange}
          onChange={(vals) => setDateRange(vals as [Dayjs, Dayjs] | null)}
          format="DD/MM/YYYY"
        />
        <Button
          type="primary"
          onClick={() => {
            if (dateRange)
              setTrigger({ from: dateRange[0].format('YYYY-MM-DD'), to: dateRange[1].format('YYYY-MM-DD') })
          }}
          disabled={!dateRange}
        >
          Generate
        </Button>
      </Space>

      {isLoading && <Spin />}
      {!isLoading && trigger && !data && <Empty description="No data" />}
      {data && (
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Title level={5} style={{ color: '#52c41a' }}>Income</Title>
            <List
              size="small"
              dataSource={income}
              renderItem={(item) => (
                <List.Item
                  extra={<Text><AmountDisplay amount={item.amount} /></Text>}
                  style={{ padding: '4px 0' }}
                >
                  <Text>{item.accountName}</Text>
                </List.Item>
              )}
            />
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <Text strong style={{ color: '#52c41a', fontSize: 15 }}>Total Income</Text>
              <Text strong style={{ color: '#52c41a', fontSize: 15 }}>
                <AmountDisplay amount={totalIncome} />
              </Text>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <Title level={5} style={{ color: '#cf1322' }}>Expenses</Title>
            <List
              size="small"
              dataSource={expenses}
              renderItem={(item) => (
                <List.Item
                  extra={<Text><AmountDisplay amount={item.amount} /></Text>}
                  style={{ padding: '4px 0' }}
                >
                  <Text>{item.accountName}</Text>
                </List.Item>
              )}
            />
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <Text strong style={{ color: '#cf1322', fontSize: 15 }}>Total Expenses</Text>
              <Text strong style={{ color: '#cf1322', fontSize: 15 }}>
                <AmountDisplay amount={totalExpenses} />
              </Text>
            </div>
          </Col>
          <Col xs={24} style={{ marginTop: 24 }}>
            <Card
              style={{
                background: isProfit ? '#f6ffed' : '#fff1f0',
                border: `1px solid ${isProfit ? '#b7eb8f' : '#ffa39e'}`,
              }}
            >
              <Statistic
                title={isProfit ? 'Net Profit' : 'Net Loss'}
                value={Math.abs(netProfit)}
                prefix="₹"
                precision={2}
                valueStyle={{ color: isProfit ? '#52c41a' : '#cf1322', fontSize: 28, fontWeight: 700 }}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}

// ── Balance Sheet ─────────────────────────────────────────────────────────────

interface BSSection {
  name: string
  accounts: { accountId: string; accountName: string; amount: number }[]
  total: number
}

interface BSData {
  assets: BSSection[]
  liabilities: BSSection[]
  equity: BSSection[]
  totalAssets: number
  totalLiabilitiesAndEquity: number
}

function BalanceSheetReport() {
  const [asOf, setAsOf] = useState<Dayjs | null>(dayjs())
  const [trigger, setTrigger] = useState<string | null>(null)

  const { data, isLoading } = useQuery<BSData>({
    queryKey: ['balance-sheet', trigger],
    queryFn: () => getBalanceSheet(trigger!).then((r) => r.data.data ?? r.data),
    enabled: !!trigger,
  })

  const totalAssets = data?.totalAssets ?? 0
  const totalLE = data?.totalLiabilitiesAndEquity ?? 0
  const isBalanced = Math.abs(totalAssets - totalLE) < 0.01

  function renderSection(sections: BSSection[], titleColor?: string) {
    return (sections ?? []).map((section) => (
      <div key={section.name} style={{ marginBottom: 16 }}>
        <Text strong style={{ color: titleColor ?? '#333' }}>{section.name}</Text>
        <List
          size="small"
          dataSource={section.accounts}
          renderItem={(item) => (
            <List.Item
              extra={<Text><AmountDisplay amount={item.amount} /></Text>}
              style={{ padding: '2px 0 2px 12px' }}
            >
              <Text type="secondary" style={{ fontSize: 13 }}>{item.accountName}</Text>
            </List.Item>
          )}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 4 }}>
          <Text>Subtotal</Text>
          <Text strong><AmountDisplay amount={section.total} /></Text>
        </div>
      </div>
    ))
  }

  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <DatePicker value={asOf} onChange={setAsOf} format="DD/MM/YYYY" placeholder="As of date" />
        <Button
          type="primary"
          onClick={() => setTrigger(asOf?.format('YYYY-MM-DD') ?? null)}
          disabled={!asOf}
        >
          Generate
        </Button>
      </Space>

      {isLoading && <Spin />}
      {!isLoading && trigger && !data && <Empty description="No data" />}
      {data && (
        <>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Card title={<Text strong style={{ color: '#1677ff' }}>Assets</Text>} size="small">
                {renderSection(data.assets, '#1677ff')}
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong style={{ fontSize: 15 }}>Total Assets</Text>
                  <Text strong style={{ fontSize: 15 }}>
                    <AmountDisplay amount={totalAssets} />
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title={<Text strong style={{ color: '#cf1322' }}>Liabilities & Equity</Text>} size="small">
                {renderSection(data.liabilities, '#cf1322')}
                {renderSection(data.equity, '#722ed1')}
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong style={{ fontSize: 15 }}>Total L + E</Text>
                  <Text strong style={{ fontSize: 15 }}>
                    <AmountDisplay amount={totalLE} />
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            {isBalanced ? (
              <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 14, padding: '4px 12px' }}>
                Balance Sheet is Balanced
              </Tag>
            ) : (
              <Tag color="error" icon={<CloseCircleOutlined />} style={{ fontSize: 14, padding: '4px 12px' }}>
                Out of Balance — Difference: <AmountDisplay amount={Math.abs(totalAssets - totalLE)} />
              </Tag>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Cash Flow ─────────────────────────────────────────────────────────────────

interface CashFlowRow {
  description: string
  amount: number
}

interface CashFlowData {
  operating: CashFlowRow[]
  investing: CashFlowRow[]
  financing: CashFlowRow[]
  netOperating: number
  netInvesting: number
  netFinancing: number
  netChange: number
  openingCash: number
  closingCash: number
}

function CashFlowReport() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().startOf('month'),
    dayjs(),
  ])
  const [trigger, setTrigger] = useState<{ from: string; to: string } | null>(null)

  const { data, isLoading } = useQuery<CashFlowData>({
    queryKey: ['cash-flow', trigger],
    queryFn: () =>
      getCashFlow(trigger!.from, trigger!.to).then((r) => r.data.data ?? r.data),
    enabled: !!trigger,
  })

  const netChange = data?.netChange ?? 0

  function renderSection(title: string, rows: CashFlowRow[], net: number, color: string) {
    return (
      <Card title={<Text strong style={{ color }}>{title}</Text>} size="small" style={{ marginBottom: 16 }}>
        <List
          size="small"
          dataSource={rows ?? []}
          renderItem={(item) => (
            <List.Item
              extra={
                <Text style={{ color: item.amount < 0 ? '#cf1322' : '#52c41a' }}>
                  {item.amount < 0 ? '(' : ''}<AmountDisplay amount={Math.abs(item.amount)} />{item.amount < 0 ? ')' : ''}
                </Text>
              }
              style={{ padding: '4px 0' }}
            >
              <Text type="secondary">{item.description}</Text>
            </List.Item>
          )}
        />
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text strong>Net {title}</Text>
          <Text strong style={{ color: net >= 0 ? '#52c41a' : '#cf1322' }}>
            {net < 0 ? '(' : ''}<AmountDisplay amount={Math.abs(net)} />{net < 0 ? ')' : ''}
          </Text>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <RangePicker
          value={dateRange}
          onChange={(vals) => setDateRange(vals as [Dayjs, Dayjs] | null)}
          format="DD/MM/YYYY"
        />
        <Button
          type="primary"
          onClick={() => {
            if (dateRange)
              setTrigger({ from: dateRange[0].format('YYYY-MM-DD'), to: dateRange[1].format('YYYY-MM-DD') })
          }}
          disabled={!dateRange}
        >
          Generate
        </Button>
      </Space>

      {isLoading && <Spin />}
      {!isLoading && trigger && !data && <Empty description="No data" />}
      {data && (
        <>
          {renderSection('Operating Activities', data.operating, data.netOperating, '#1677ff')}
          {renderSection('Investing Activities', data.investing, data.netInvesting, '#fa8c16')}
          {renderSection('Financing Activities', data.financing, data.netFinancing, '#722ed1')}

          <Card
            style={{
              background: netChange >= 0 ? '#f6ffed' : '#fff1f0',
              border: `1px solid ${netChange >= 0 ? '#b7eb8f' : '#ffa39e'}`,
              marginBottom: 16,
            }}
          >
            <Statistic
              title="Net Change in Cash"
              value={Math.abs(netChange)}
              prefix="₹"
              precision={2}
              valueStyle={{ color: netChange >= 0 ? '#52c41a' : '#cf1322', fontSize: 24, fontWeight: 700 }}
            />
          </Card>

          <Row gutter={16}>
            <Col xs={12}>
              <Card size="small">
                <Statistic
                  title="Opening Cash Balance"
                  value={data.openingCash}
                  prefix="₹"
                  precision={2}
                  valueStyle={{ fontSize: 18 }}
                />
              </Card>
            </Col>
            <Col xs={12}>
              <Card size="small">
                <Statistic
                  title="Closing Cash Balance"
                  value={data.closingCash}
                  prefix="₹"
                  precision={2}
                  valueStyle={{ fontSize: 18, fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  )
}

// ── Day Book ──────────────────────────────────────────────────────────────────

interface DayBookLine {
  accountId: string
  accountName: string
  debit: number
  credit: number
}

interface DayBookEntry {
  jeNo: string
  narration: string
  refDocument?: string
  lines: DayBookLine[]
  totalDebit: number
  totalCredit: number
}

interface DayBookData {
  entries: DayBookEntry[]
  dailyTotalDebit: number
  dailyTotalCredit: number
}

function DayBookReport() {
  const [date, setDate] = useState<Dayjs | null>(dayjs())
  const [trigger, setTrigger] = useState<string | null>(null)

  const { data, isLoading } = useQuery<DayBookData>({
    queryKey: ['day-book', trigger],
    queryFn: () => getDayBook(trigger!).then((r) => r.data.data ?? r.data),
    enabled: !!trigger,
  })

  const entries = data?.entries ?? []

  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <DatePicker value={date} onChange={setDate} format="DD/MM/YYYY" placeholder="Select date" />
        <Button
          type="primary"
          onClick={() => setTrigger(date?.format('YYYY-MM-DD') ?? null)}
          disabled={!date}
        >
          Generate
        </Button>
      </Space>

      {isLoading && <Spin />}
      {!isLoading && trigger && entries.length === 0 && (
        <Empty description="No transactions on this date" />
      )}
      {entries.length > 0 && (
        <>
          {entries.map((entry, idx) => (
            <Card
              key={entry.jeNo}
              size="small"
              style={{ marginBottom: 12 }}
              title={
                <Space>
                  <Text code>{entry.jeNo}</Text>
                  <Text type="secondary">{entry.narration}</Text>
                  {entry.refDocument && (
                    <Tag style={{ fontSize: 11 }}>{entry.refDocument}</Tag>
                  )}
                </Space>
              }
            >
              <Table
                dataSource={entry.lines}
                rowKey={(r) => `${idx}-${r.accountId}`}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Account',
                    dataIndex: 'accountName',
                    key: 'accountName',
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
                ]}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <Text strong>Entry Total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong><AmountDisplay amount={entry.totalDebit} /></Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <Text strong><AmountDisplay amount={entry.totalCredit} /></Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </Card>
          ))}

          {data && (
            <Card
              style={{ background: '#f0f5ff', border: '1px solid #adc6ff' }}
              size="small"
            >
              <Row gutter={16}>
                <Col xs={12}>
                  <Statistic
                    title="Daily Total Debits"
                    value={data.dailyTotalDebit}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: '#1677ff', fontWeight: 700 }}
                  />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title="Daily Total Credits"
                    value={data.dailyTotalCredit}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                  />
                </Col>
              </Row>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FinancialReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('trial-balance')

  const reportComponents: Record<ReportType, React.ReactNode> = {
    'trial-balance': <TrialBalanceReport />,
    'profit-loss': <ProfitLossReport />,
    'balance-sheet': <BalanceSheetReport />,
    'cash-flow': <CashFlowReport />,
    'day-book': <DayBookReport />,
  }

  const activeCard = reportCards.find((r) => r.key === activeReport)!

  return (
    <div>
      <PageHeader
        title="Financial Reports"
        subtitle="Generate and view financial statements"
      />

      <Row gutter={16}>
        <Col xs={24} md={6}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reportCards.map((card) => (
              <Card
                key={card.key}
                size="small"
                hoverable
                onClick={() => setActiveReport(card.key)}
                style={{
                  cursor: 'pointer',
                  borderColor: activeReport === card.key ? '#1677ff' : '#f0f0f0',
                  background: activeReport === card.key ? '#e6f4ff' : '#fff',
                }}
              >
                <Space>
                  <span style={{ color: activeReport === card.key ? '#1677ff' : '#888' }}>
                    {card.icon}
                  </span>
                  <div>
                    <div>
                      <Text strong style={{ color: activeReport === card.key ? '#1677ff' : 'inherit' }}>
                        {card.label}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {card.description}
                    </Text>
                  </div>
                </Space>
              </Card>
            ))}
          </div>
        </Col>

        <Col xs={24} md={18}>
          <Card
            title={
              <Space>
                <span style={{ color: '#1677ff' }}>{activeCard.icon}</span>
                <Text strong style={{ fontSize: 15 }}>{activeCard.label}</Text>
              </Space>
            }
          >
            {reportComponents[activeReport]}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
