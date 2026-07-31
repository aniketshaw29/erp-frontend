import { Table, Tabs, Typography, Badge } from 'antd'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import {
  getReceivables,
  getPayables,
  getReceivablesAging,
  getPayablesAging,
} from '../../api/modules/accounts.api'

const { Text } = Typography

interface OutstandingRow {
  id: string
  partyId: string
  partyName: string
  gstin?: string
  totalOutstanding: number
  overdueAmount: number
  invoiceCount: number
  hasOverdue: boolean
}

interface AgingRow {
  partyId: string
  partyName: string
  current: number
  days1to30: number
  days31to60: number
  days61to90: number
  days90plus: number
  total: number
}

const agingBucketColors: Record<string, string> = {
  current: '#52c41a',
  days1to30: '#d4b106',
  days31to60: '#fa8c16',
  days61to90: '#f5222d',
  days90plus: '#820014',
}

const agingBgColors: Record<string, string> = {
  current: '#f6ffed',
  days1to30: '#fffbe6',
  days31to60: '#fff7e6',
  days61to90: '#fff1f0',
  days90plus: '#fff0f6',
}

function makeAmountCell(colorKey: string) {
  return (amt: number) => (
    <div
      style={{
        background: amt > 0 ? agingBgColors[colorKey] : 'transparent',
        padding: '2px 4px',
        borderRadius: 4,
        textAlign: 'right',
      }}
    >
      <Text style={amt > 0 ? { color: agingBucketColors[colorKey] } : { color: '#999' }}>
        <AmountDisplay amount={amt} />
      </Text>
    </div>
  )
}

// ── Receivables Tab ───────────────────────────────────────────────────────────

function ReceivablesTab() {
  const { data, isLoading } = useQuery<OutstandingRow[]>({
    queryKey: ['receivables'],
    queryFn: () => getReceivables().then((r) => r.data.data ?? r.data ?? []),
  })

  const rows = data ?? []

  const columns: ColumnsType<OutstandingRow> = [
    {
      title: 'Customer Name',
      dataIndex: 'partyName',
      key: 'partyName',
      sorter: (a, b) => a.partyName.localeCompare(b.partyName),
    },
    {
      title: 'GSTIN',
      dataIndex: 'gstin',
      key: 'gstin',
      width: 160,
      render: (v?: string) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: 'Invoice Count',
      dataIndex: 'invoiceCount',
      key: 'invoiceCount',
      align: 'center',
      width: 120,
      sorter: (a, b) => a.invoiceCount - b.invoiceCount,
    },
    {
      title: 'Total Outstanding',
      dataIndex: 'totalOutstanding',
      key: 'totalOutstanding',
      align: 'right',
      width: 160,
      sorter: (a, b) => a.totalOutstanding - b.totalOutstanding,
      defaultSortOrder: 'descend',
      render: (amt: number) => (
        <Text style={amt > 0 ? { color: '#cf1322', fontWeight: 600 } : {}}>
          <AmountDisplay amount={amt} />
        </Text>
      ),
    },
    {
      title: 'Overdue Amount',
      dataIndex: 'overdueAmount',
      key: 'overdueAmount',
      align: 'right',
      width: 160,
      sorter: (a, b) => a.overdueAmount - b.overdueAmount,
      render: (amt: number) =>
        amt > 0 ? (
          <Text style={{ color: '#cf1322', fontWeight: 600 }}>
            <AmountDisplay amount={amt} />
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Overdue',
      dataIndex: 'hasOverdue',
      key: 'hasOverdue',
      align: 'center',
      width: 100,
      render: (v: boolean) =>
        v ? <Badge status="error" text="Yes" /> : <Badge status="success" text="No" />,
    },
  ]

  const totalOutstanding = rows.reduce((s, r) => s + r.totalOutstanding, 0)
  const totalOverdue = rows.reduce((s, r) => s + r.overdueAmount, 0)

  return (
    <Table<OutstandingRow>
      dataSource={rows}
      columns={columns}
      rowKey="partyId"
      loading={isLoading}
      pagination={{ pageSize: 20 }}
      size="small"
      summary={() => (
        <Table.Summary.Row>
          <Table.Summary.Cell index={0}>
            <Text strong>Total</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={1} />
          <Table.Summary.Cell index={2} align="center">
            <Text strong>{rows.reduce((s, r) => s + r.invoiceCount, 0)}</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={3} align="right">
            <Text strong style={{ color: '#cf1322' }}>
              <AmountDisplay amount={totalOutstanding} />
            </Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={4} align="right">
            <Text strong style={{ color: '#cf1322' }}>
              <AmountDisplay amount={totalOverdue} />
            </Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={5} />
        </Table.Summary.Row>
      )}
    />
  )
}

// ── Receivables Aging Tab ─────────────────────────────────────────────────────

function ReceivablesAgingTab() {
  const { data, isLoading } = useQuery<AgingRow[]>({
    queryKey: ['receivables-aging'],
    queryFn: () => getReceivablesAging().then((r) => r.data.data ?? r.data ?? []),
  })

  const rows = data ?? []
  const sumField = (field: keyof AgingRow) =>
    rows.reduce((s, r) => s + ((r[field] as number) ?? 0), 0)

  const columns: ColumnsType<AgingRow> = [
    {
      title: 'Customer',
      dataIndex: 'partyName',
      key: 'partyName',
      fixed: 'left',
      width: 180,
      sorter: (a, b) => a.partyName.localeCompare(b.partyName),
    },
    {
      title: <span style={{ color: agingBucketColors.current }}>Current</span>,
      dataIndex: 'current',
      key: 'current',
      align: 'right',
      render: makeAmountCell('current'),
    },
    {
      title: <span style={{ color: agingBucketColors.days1to30 }}>1–30 days</span>,
      dataIndex: 'days1to30',
      key: 'days1to30',
      align: 'right',
      render: makeAmountCell('days1to30'),
    },
    {
      title: <span style={{ color: agingBucketColors.days31to60 }}>31–60 days</span>,
      dataIndex: 'days31to60',
      key: 'days31to60',
      align: 'right',
      render: makeAmountCell('days31to60'),
    },
    {
      title: <span style={{ color: agingBucketColors.days61to90 }}>61–90 days</span>,
      dataIndex: 'days61to90',
      key: 'days61to90',
      align: 'right',
      render: makeAmountCell('days61to90'),
    },
    {
      title: <span style={{ color: agingBucketColors.days90plus }}>90+ days</span>,
      dataIndex: 'days90plus',
      key: 'days90plus',
      align: 'right',
      render: makeAmountCell('days90plus'),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      width: 140,
      sorter: (a, b) => a.total - b.total,
      defaultSortOrder: 'descend',
      render: (amt: number) => (
        <Text strong style={{ color: amt > 0 ? '#cf1322' : 'inherit' }}>
          <AmountDisplay amount={amt} />
        </Text>
      ),
    },
  ]

  return (
    <Table<AgingRow>
      dataSource={rows}
      columns={columns}
      rowKey="partyId"
      loading={isLoading}
      pagination={{ pageSize: 20 }}
      size="small"
      scroll={{ x: 900 }}
      summary={() => (
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} fixed="left">
            <Text strong>Total</Text>
          </Table.Summary.Cell>
          {(['current', 'days1to30', 'days31to60', 'days61to90', 'days90plus'] as const).map((f, i) => (
            <Table.Summary.Cell key={f} index={i + 1} align="right">
              <Text strong style={{ color: agingBucketColors[f] }}>
                <AmountDisplay amount={sumField(f)} />
              </Text>
            </Table.Summary.Cell>
          ))}
          <Table.Summary.Cell index={6} align="right">
            <Text strong style={{ color: '#cf1322' }}>
              <AmountDisplay amount={sumField('total')} />
            </Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}
    />
  )
}

// ── Payables Tab ──────────────────────────────────────────────────────────────

function PayablesTab() {
  const { data, isLoading } = useQuery<OutstandingRow[]>({
    queryKey: ['payables'],
    queryFn: () => getPayables().then((r) => r.data.data ?? r.data ?? []),
  })

  const rows = data ?? []

  const columns: ColumnsType<OutstandingRow> = [
    {
      title: 'Supplier Name',
      dataIndex: 'partyName',
      key: 'partyName',
      sorter: (a, b) => a.partyName.localeCompare(b.partyName),
    },
    {
      title: 'GSTIN',
      dataIndex: 'gstin',
      key: 'gstin',
      width: 160,
      render: (v?: string) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: 'Bill Count',
      dataIndex: 'invoiceCount',
      key: 'invoiceCount',
      align: 'center',
      width: 120,
      sorter: (a, b) => a.invoiceCount - b.invoiceCount,
    },
    {
      title: 'Total Outstanding',
      dataIndex: 'totalOutstanding',
      key: 'totalOutstanding',
      align: 'right',
      width: 160,
      sorter: (a, b) => a.totalOutstanding - b.totalOutstanding,
      defaultSortOrder: 'descend',
      render: (amt: number) => (
        <Text style={amt > 0 ? { color: '#cf1322', fontWeight: 600 } : {}}>
          <AmountDisplay amount={amt} />
        </Text>
      ),
    },
    {
      title: 'Overdue Amount',
      dataIndex: 'overdueAmount',
      key: 'overdueAmount',
      align: 'right',
      width: 160,
      sorter: (a, b) => a.overdueAmount - b.overdueAmount,
      render: (amt: number) =>
        amt > 0 ? (
          <Text style={{ color: '#cf1322', fontWeight: 600 }}>
            <AmountDisplay amount={amt} />
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Overdue',
      dataIndex: 'hasOverdue',
      key: 'hasOverdue',
      align: 'center',
      width: 100,
      render: (v: boolean) =>
        v ? <Badge status="error" text="Yes" /> : <Badge status="success" text="No" />,
    },
  ]

  const totalOutstanding = rows.reduce((s, r) => s + r.totalOutstanding, 0)
  const totalOverdue = rows.reduce((s, r) => s + r.overdueAmount, 0)

  return (
    <Table<OutstandingRow>
      dataSource={rows}
      columns={columns}
      rowKey="partyId"
      loading={isLoading}
      pagination={{ pageSize: 20 }}
      size="small"
      summary={() => (
        <Table.Summary.Row>
          <Table.Summary.Cell index={0}>
            <Text strong>Total</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={1} />
          <Table.Summary.Cell index={2} align="center">
            <Text strong>{rows.reduce((s, r) => s + r.invoiceCount, 0)}</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={3} align="right">
            <Text strong style={{ color: '#cf1322' }}>
              <AmountDisplay amount={totalOutstanding} />
            </Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={4} align="right">
            <Text strong style={{ color: '#cf1322' }}>
              <AmountDisplay amount={totalOverdue} />
            </Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={5} />
        </Table.Summary.Row>
      )}
    />
  )
}

// ── Payables Aging Tab ────────────────────────────────────────────────────────

function PayablesAgingTab() {
  const { data, isLoading } = useQuery<AgingRow[]>({
    queryKey: ['payables-aging'],
    queryFn: () => getPayablesAging().then((r) => r.data.data ?? r.data ?? []),
  })

  const rows = data ?? []
  const sumField = (field: keyof AgingRow) =>
    rows.reduce((s, r) => s + ((r[field] as number) ?? 0), 0)

  const columns: ColumnsType<AgingRow> = [
    {
      title: 'Supplier',
      dataIndex: 'partyName',
      key: 'partyName',
      fixed: 'left',
      width: 180,
      sorter: (a, b) => a.partyName.localeCompare(b.partyName),
    },
    {
      title: <span style={{ color: agingBucketColors.current }}>Current</span>,
      dataIndex: 'current',
      key: 'current',
      align: 'right',
      render: makeAmountCell('current'),
    },
    {
      title: <span style={{ color: agingBucketColors.days1to30 }}>1–30 days</span>,
      dataIndex: 'days1to30',
      key: 'days1to30',
      align: 'right',
      render: makeAmountCell('days1to30'),
    },
    {
      title: <span style={{ color: agingBucketColors.days31to60 }}>31–60 days</span>,
      dataIndex: 'days31to60',
      key: 'days31to60',
      align: 'right',
      render: makeAmountCell('days31to60'),
    },
    {
      title: <span style={{ color: agingBucketColors.days61to90 }}>61–90 days</span>,
      dataIndex: 'days61to90',
      key: 'days61to90',
      align: 'right',
      render: makeAmountCell('days61to90'),
    },
    {
      title: <span style={{ color: agingBucketColors.days90plus }}>90+ days</span>,
      dataIndex: 'days90plus',
      key: 'days90plus',
      align: 'right',
      render: makeAmountCell('days90plus'),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      width: 140,
      sorter: (a, b) => a.total - b.total,
      defaultSortOrder: 'descend',
      render: (amt: number) => (
        <Text strong style={{ color: amt > 0 ? '#cf1322' : 'inherit' }}>
          <AmountDisplay amount={amt} />
        </Text>
      ),
    },
  ]

  return (
    <Table<AgingRow>
      dataSource={rows}
      columns={columns}
      rowKey="partyId"
      loading={isLoading}
      pagination={{ pageSize: 20 }}
      size="small"
      scroll={{ x: 900 }}
      summary={() => (
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} fixed="left">
            <Text strong>Total</Text>
          </Table.Summary.Cell>
          {(['current', 'days1to30', 'days31to60', 'days61to90', 'days90plus'] as const).map((f, i) => (
            <Table.Summary.Cell key={f} index={i + 1} align="right">
              <Text strong style={{ color: agingBucketColors[f] }}>
                <AmountDisplay amount={sumField(f)} />
              </Text>
            </Table.Summary.Cell>
          ))}
          <Table.Summary.Cell index={6} align="right">
            <Text strong style={{ color: '#cf1322' }}>
              <AmountDisplay amount={sumField('total')} />
            </Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}
    />
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OutstandingPage() {
  return (
    <div>
      <PageHeader
        title="Outstanding"
        subtitle="Receivables and payables with aging analysis"
      />
      <Tabs
        defaultActiveKey="receivables"
        items={[
          {
            key: 'receivables',
            label: 'Receivables',
            children: <ReceivablesTab />,
          },
          {
            key: 'receivables-aging',
            label: 'Receivables Aging',
            children: <ReceivablesAgingTab />,
          },
          {
            key: 'payables',
            label: 'Payables',
            children: <PayablesTab />,
          },
          {
            key: 'payables-aging',
            label: 'Payables Aging',
            children: <PayablesAgingTab />,
          },
        ]}
      />
    </div>
  )
}
