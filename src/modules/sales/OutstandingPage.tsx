import { Typography, Table, Tabs } from 'antd'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import { getCustomerOutstanding, getAgingReport } from '../../api/modules/sales.api'
import type { OutstandingRow, AgingRow } from '../../types/sales.types'

const { Text } = Typography

// ── Outstanding tab ───────────────────────────────────────────────────────────

function CustomerOutstandingTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-outstanding'],
    queryFn: () => getCustomerOutstanding().then((r) => r.data.data),
  })

  const columns: ColumnsType<OutstandingRow> = [
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
    },
    {
      title: 'Invoice Count',
      dataIndex: 'invoiceCount',
      key: 'invoiceCount',
      align: 'center',
      sorter: (a, b) => a.invoiceCount - b.invoiceCount,
    },
    {
      title: 'Total Outstanding',
      dataIndex: 'totalOutstanding',
      key: 'totalOutstanding',
      align: 'right',
      sorter: (a, b) => a.totalOutstanding - b.totalOutstanding,
      defaultSortOrder: 'descend',
      render: (amt: number) => (
        <Text style={amt > 0 ? { color: '#cf1322', fontWeight: 600 } : {}}>
          <AmountDisplay amount={amt} />
        </Text>
      ),
    },
  ]

  return (
    <Table<OutstandingRow>
      dataSource={data ?? []}
      columns={columns}
      rowKey="customerId"
      loading={isLoading}
      pagination={{ pageSize: 20 }}
      size="small"
      summary={(rows) => {
        const total = rows.reduce((s, r) => s + r.totalOutstanding, 0)
        return (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0}>
              <Text strong>Total</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="center">
              <Text strong>{rows.reduce((s, r) => s + r.invoiceCount, 0)}</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} align="right">
              <Text strong style={{ color: '#cf1322' }}>
                <AmountDisplay amount={total} />
              </Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )
      }}
    />
  )
}

// ── Aging tab ─────────────────────────────────────────────────────────────────

const agingBucketColors: Record<string, string> = {
  current: '#52c41a',
  days1to30: '#d4b106',
  days31to60: '#fa8c16',
  days61to90: '#f5222d',
  days90plus: '#820014',
}

function AgingReportTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['aging-report'],
    queryFn: () => getAgingReport().then((r) => r.data.data),
  })

  const amountCell =
    (colorKey: string) =>
    (amt: number) =>
      (
        <Text style={amt > 0 ? { color: agingBucketColors[colorKey] } : { color: '#999' }}>
          <AmountDisplay amount={amt} />
        </Text>
      )

  const columns: ColumnsType<AgingRow> = [
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      fixed: 'left',
      width: 180,
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      sorter: (a, b) => a.total - b.total,
      defaultSortOrder: 'descend',
      render: (amt: number) => (
        <Text strong>
          <AmountDisplay amount={amt} />
        </Text>
      ),
    },
    {
      title: <span style={{ color: agingBucketColors.current }}>Current</span>,
      dataIndex: 'current',
      key: 'current',
      align: 'right',
      render: amountCell('current'),
    },
    {
      title: <span style={{ color: agingBucketColors.days1to30 }}>1–30 days</span>,
      dataIndex: 'days1to30',
      key: 'days1to30',
      align: 'right',
      render: amountCell('days1to30'),
    },
    {
      title: <span style={{ color: agingBucketColors.days31to60 }}>31–60 days</span>,
      dataIndex: 'days31to60',
      key: 'days31to60',
      align: 'right',
      render: amountCell('days31to60'),
    },
    {
      title: <span style={{ color: agingBucketColors.days61to90 }}>61–90 days</span>,
      dataIndex: 'days61to90',
      key: 'days61to90',
      align: 'right',
      render: amountCell('days61to90'),
    },
    {
      title: <span style={{ color: agingBucketColors.days90plus }}>90+ days</span>,
      dataIndex: 'days90plus',
      key: 'days90plus',
      align: 'right',
      render: amountCell('days90plus'),
    },
  ]

  const rows = data ?? []
  const sumField = (field: keyof AgingRow) =>
    rows.reduce((s, r) => s + (r[field] as number), 0)

  return (
    <Table<AgingRow>
      dataSource={rows}
      columns={columns}
      rowKey="customerId"
      loading={isLoading}
      pagination={{ pageSize: 20 }}
      size="small"
      scroll={{ x: 900 }}
      summary={() => (
        <Table.Summary.Row>
          <Table.Summary.Cell index={0}>
            <Text strong>Total</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={1} align="right">
            <Text strong>
              <AmountDisplay amount={sumField('total')} />
            </Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} align="right">
            <Text strong style={{ color: agingBucketColors.current }}>
              <AmountDisplay amount={sumField('current')} />
            </Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={3} align="right">
            <Text strong style={{ color: agingBucketColors.days1to30 }}>
              <AmountDisplay amount={sumField('days1to30')} />
            </Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={4} align="right">
            <Text strong style={{ color: agingBucketColors.days31to60 }}>
              <AmountDisplay amount={sumField('days31to60')} />
            </Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={5} align="right">
            <Text strong style={{ color: agingBucketColors.days61to90 }}>
              <AmountDisplay amount={sumField('days61to90')} />
            </Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={6} align="right">
            <Text strong style={{ color: agingBucketColors.days90plus }}>
              <AmountDisplay amount={sumField('days90plus')} />
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
        title="Receivables"
        subtitle="Customer outstanding and aging analysis"
      />
      <Tabs
        defaultActiveKey="outstanding"
        items={[
          {
            key: 'outstanding',
            label: 'Customer Outstanding',
            children: <CustomerOutstandingTab />,
          },
          {
            key: 'aging',
            label: 'Aging Report',
            children: <AgingReportTab />,
          },
        ]}
      />
    </div>
  )
}
