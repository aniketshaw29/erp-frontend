import { useState, useCallback } from 'react'
import {
  Table,
  Button,
  Select,
  DatePicker,
  Space,
  Typography,
  Card,
  Statistic,
  Row,
  Col,
  message,
  Empty,
} from 'antd'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import { getChartOfAccounts, getAccountLedger } from '../../api/modules/accounts.api'

const { Text, Link } = Typography
const { RangePicker } = DatePicker

interface Account {
  id: string
  code: string
  name: string
  isLeaf: boolean
  children?: Account[]
}

interface LedgerRow {
  id: string
  date: string
  jeNo: string
  narration: string
  refDocument?: string
  debit: number
  credit: number
  balance: number
}

interface LedgerSummary {
  openingBalance: number
  totalDebits: number
  totalCredits: number
  closingBalance: number
  entries: LedgerRow[]
}

function flattenLeafAccounts(accounts: Account[]): Account[] {
  const result: Account[] = []
  function traverse(acc: Account) {
    if (acc.isLeaf) result.push(acc)
    acc.children?.forEach(traverse)
  }
  accounts.forEach(traverse)
  return result
}

function exportToCSV(rows: LedgerRow[], accountName: string) {
  const headers = ['Date', 'JE No', 'Narration', 'Ref Document', 'Debit', 'Credit', 'Balance']
  const csvRows = [
    headers.join(','),
    ...rows.map((r) =>
      [
        dayjs(r.date).format('DD/MM/YYYY'),
        r.jeNo,
        `"${r.narration.replace(/"/g, '""')}"`,
        r.refDocument ?? '',
        r.debit.toFixed(2),
        r.credit.toFixed(2),
        r.balance.toFixed(2),
      ].join(',')
    ),
  ]
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Ledger_${accountName}_${dayjs().format('YYYYMMDD')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function LedgerPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [loadParams, setLoadParams] = useState<{ accountId: string; from: string; to: string } | null>(null)

  const { data: accountsData } = useQuery<Account[]>({
    queryKey: ['chart-of-accounts'],
    queryFn: () => getChartOfAccounts().then((r) => r.data.data ?? r.data),
  })

  const leafAccounts = flattenLeafAccounts(accountsData ?? [])
  const selectedAccountObj = leafAccounts.find((a) => a.id === loadParams?.accountId)

  const { data: ledgerData, isLoading, isFetching } = useQuery<LedgerSummary>({
    queryKey: ['account-ledger', loadParams],
    queryFn: () =>
      getAccountLedger(loadParams!.accountId, { from: loadParams!.from, to: loadParams!.to }).then(
        (r) => r.data.data ?? r.data
      ),
    enabled: !!loadParams,
  })

  const handleLoad = useCallback(() => {
    if (!selectedAccountId) {
      message.warning('Please select an account')
      return
    }
    if (!dateRange) {
      message.warning('Please select a date range')
      return
    }
    setLoadParams({
      accountId: selectedAccountId,
      from: dateRange[0].format('YYYY-MM-DD'),
      to: dateRange[1].format('YYYY-MM-DD'),
    })
  }, [selectedAccountId, dateRange])

  const entries: LedgerRow[] = ledgerData?.entries ?? []

  const columns: ColumnsType<LedgerRow> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'JE No.',
      dataIndex: 'jeNo',
      key: 'jeNo',
      width: 120,
      render: (v: string) => <Text code>{v}</Text>,
    },
    {
      title: 'Narration',
      dataIndex: 'narration',
      key: 'narration',
    },
    {
      title: 'Ref Document',
      dataIndex: 'refDocument',
      key: 'refDocument',
      width: 140,
      render: (v?: string) => v ? <Text type="secondary">{v}</Text> : <Text type="secondary">—</Text>,
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
          {v < 0 && ' Cr'}
        </Text>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Account Ledger"
        subtitle="View transaction history for any account"
        actions={
          ledgerData && entries.length > 0 ? (
            <Button
              icon={<DownloadOutlined />}
              onClick={() => exportToCSV(entries, selectedAccountObj?.name ?? 'Account')}
            >
              Export CSV
            </Button>
          ) : undefined
        }
      />

      <Card style={{ marginBottom: 24 }}>
        <Space wrap size={12}>
          <Select
            showSearch
            placeholder="Select account"
            value={selectedAccountId}
            onChange={setSelectedAccountId}
            style={{ minWidth: 280 }}
            optionFilterProp="label"
            options={leafAccounts.map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }))}
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

      {ledgerData && (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Opening Balance"
                  value={ledgerData.openingBalance}
                  prefix="₹"
                  precision={2}
                  valueStyle={{ color: ledgerData.openingBalance < 0 ? '#cf1322' : 'inherit' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Total Debits"
                  value={ledgerData.totalDebits}
                  prefix="₹"
                  precision={2}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Total Credits"
                  value={ledgerData.totalCredits}
                  prefix="₹"
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Closing Balance"
                  value={Math.abs(ledgerData.closingBalance)}
                  prefix="₹"
                  precision={2}
                  suffix={ledgerData.closingBalance < 0 ? ' Cr' : ''}
                  valueStyle={{ color: ledgerData.closingBalance < 0 ? '#cf1322' : '#52c41a', fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>

          {entries.length === 0 ? (
            <Empty description="No transactions found for selected period" />
          ) : (
            <Table<LedgerRow>
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

      {!ledgerData && !isLoading && (
        <Empty description="Select an account and date range, then click Load" style={{ marginTop: 40 }} />
      )}
    </div>
  )
}
