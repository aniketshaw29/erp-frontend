import { useState } from 'react'
import {
  Table,
  Button,
  Drawer,
  Form,
  Select,
  DatePicker,
  Input,
  InputNumber,
  Space,
  Typography,
  Divider,
  message,
  Tag,
  Tooltip,
} from 'antd'
import { PlusOutlined, DeleteOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import StatusBadge from '../../components/StatusBadge'
import { getJournalEntries, createJournalEntry, getChartOfAccounts } from '../../api/modules/accounts.api'
import { getParties } from '../../api/modules/party.api'

const { Text } = Typography

interface Account {
  id: string
  code: string
  name: string
  accountType: string
  isLeaf: boolean
  children?: Account[]
}

interface Party {
  id: string
  name: string
}

interface JournalEntry {
  id: string
  jeNo: string
  date: string
  narration: string
  totalDebit: number
  totalCredit: number
  status: string
  entryType: string
}

interface LineItem {
  key: string
  accountId: string
  partyId?: string
  debit: number
  credit: number
  remarks: string
}

function newLine(): LineItem {
  return {
    key: `${Date.now()}-${Math.random()}`,
    accountId: '',
    partyId: undefined,
    debit: 0,
    credit: 0,
    remarks: '',
  }
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

interface JournalFormDrawerProps {
  open: boolean
  onClose: () => void
  leafAccounts: Account[]
  parties: Party[]
  onSuccess: () => void
}

function JournalFormDrawer({ open, onClose, leafAccounts, parties, onSuccess }: JournalFormDrawerProps) {
  const [form] = Form.useForm()
  const [lines, setLines] = useState<LineItem[]>([newLine(), newLine()])

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0)
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0)
  const difference = totalDebit - totalCredit
  const isBalanced = Math.abs(difference) < 0.01

  const createMutation = useMutation({
    mutationFn: (data: any) => createJournalEntry(data),
    onSuccess: () => {
      message.success('Journal entry created')
      form.resetFields()
      setLines([newLine(), newLine()])
      onSuccess()
      onClose()
    },
    onError: () => message.error('Failed to create journal entry'),
  })

  const addLine = () => setLines((prev) => [...prev, newLine()])

  const removeLine = (key: string) =>
    setLines((prev) => prev.length > 2 ? prev.filter((l) => l.key !== key) : prev)

  const updateLine = (key: string, field: keyof LineItem, value: any) => {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, [field]: value } : l))
    )
  }

  const handleSubmit = async () => {
    if (!isBalanced) {
      message.warning('Debits must equal Credits before submitting')
      return
    }
    const values = await form.validateFields()
    const validLines = lines.filter((l) => l.accountId)
    if (validLines.length < 2) {
      message.warning('Add at least 2 line items')
      return
    }
    createMutation.mutate({
      date: values.date.format('YYYY-MM-DD'),
      narration: values.narration,
      entryType: values.entryType,
      lines: validLines.map(({ key, ...rest }) => rest),
      totalDebit,
      totalCredit,
    })
  }

  const lineColumns = [
    {
      title: 'Account',
      key: 'accountId',
      width: 220,
      render: (_: unknown, record: LineItem) => (
        <Select
          showSearch
          value={record.accountId || undefined}
          placeholder="Select account"
          onChange={(val) => updateLine(record.key, 'accountId', val)}
          style={{ width: '100%' }}
          optionFilterProp="label"
          options={leafAccounts.map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }))}
        />
      ),
    },
    {
      title: 'Party',
      key: 'partyId',
      width: 160,
      render: (_: unknown, record: LineItem) => (
        <Select
          showSearch
          allowClear
          value={record.partyId}
          placeholder="Optional"
          onChange={(val) => updateLine(record.key, 'partyId', val)}
          style={{ width: '100%' }}
          optionFilterProp="label"
          options={parties.map((p) => ({ value: p.id, label: p.name }))}
        />
      ),
    },
    {
      title: 'Debit',
      key: 'debit',
      width: 120,
      render: (_: unknown, record: LineItem) => (
        <InputNumber
          min={0}
          precision={2}
          value={record.debit}
          onChange={(val) => {
            updateLine(record.key, 'debit', val ?? 0)
            if ((val ?? 0) > 0) updateLine(record.key, 'credit', 0)
          }}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Credit',
      key: 'credit',
      width: 120,
      render: (_: unknown, record: LineItem) => (
        <InputNumber
          min={0}
          precision={2}
          value={record.credit}
          onChange={(val) => {
            updateLine(record.key, 'credit', val ?? 0)
            if ((val ?? 0) > 0) updateLine(record.key, 'debit', 0)
          }}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Remarks',
      key: 'remarks',
      render: (_: unknown, record: LineItem) => (
        <Input
          value={record.remarks}
          onChange={(e) => updateLine(record.key, 'remarks', e.target.value)}
          placeholder="Optional"
        />
      ),
    },
    {
      title: '',
      key: 'remove',
      width: 40,
      render: (_: unknown, record: LineItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeLine(record.key)}
          disabled={lines.length <= 2}
        />
      ),
    },
  ]

  return (
    <Drawer
      title="New Journal Entry"
      open={open}
      onClose={onClose}
      width={900}
      destroyOnClose
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose} disabled={createMutation.isPending}>Cancel</Button>
          <Tooltip title={!isBalanced ? 'Debits must equal Credits' : ''}>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={createMutation.isPending}
              disabled={!isBalanced}
            >
              Submit Entry
            </Button>
          </Tooltip>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Space wrap style={{ width: '100%' }} size={16}>
          <Form.Item
            name="date"
            label="Posting Date"
            rules={[{ required: true, message: 'Select date' }]}
            initialValue={dayjs()}
            style={{ marginBottom: 0 }}
          >
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item
            name="entryType"
            label="Entry Type"
            rules={[{ required: true, message: 'Select type' }]}
            style={{ marginBottom: 0, minWidth: 160 }}
          >
            <Select
              options={[
                { value: 'ADJUSTMENT', label: 'Adjustment' },
                { value: 'OPENING', label: 'Opening' },
              ]}
              placeholder="Select type"
            />
          </Form.Item>
          <Form.Item
            name="narration"
            label="Narration"
            rules={[{ required: true, message: 'Enter narration' }]}
            style={{ marginBottom: 0, minWidth: 320 }}
          >
            <Input placeholder="Enter narration..." />
          </Form.Item>
        </Space>
      </Form>

      <Divider orientation="left" style={{ marginTop: 16 }}>Line Items</Divider>

      <Table
        dataSource={lines}
        columns={lineColumns}
        rowKey="key"
        pagination={false}
        size="small"
        scroll={{ x: 800 }}
        footer={() => (
          <Button type="dashed" icon={<PlusCircleOutlined />} onClick={addLine} block>
            Add Line
          </Button>
        )}
      />

      <div
        style={{
          marginTop: 16,
          padding: '12px 16px',
          background: '#fafafa',
          borderRadius: 8,
          border: '1px solid #f0f0f0',
          display: 'flex',
          gap: 32,
          alignItems: 'center',
        }}
      >
        <Text>
          <Text type="secondary">Total Debits: </Text>
          <Text strong><AmountDisplay amount={totalDebit} /></Text>
        </Text>
        <Text>
          <Text type="secondary">Total Credits: </Text>
          <Text strong><AmountDisplay amount={totalCredit} /></Text>
        </Text>
        <Text>
          <Text type="secondary">Difference: </Text>
          <Text strong style={{ color: isBalanced ? '#52c41a' : '#cf1322' }}>
            <AmountDisplay amount={Math.abs(difference)} />
          </Text>
        </Text>
        {isBalanced ? (
          <Tag color="success">Balanced</Tag>
        ) : (
          <Tag color="error">Out of Balance</Tag>
        )}
      </div>
    </Drawer>
  )
}

export default function JournalEntryPage() {
  const queryClient = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data: journalData, isLoading } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => getJournalEntries().then((r) => r.data.data ?? r.data ?? []),
  })

  const { data: accountsData } = useQuery<Account[]>({
    queryKey: ['chart-of-accounts'],
    queryFn: () => getChartOfAccounts().then((r) => r.data.data ?? r.data),
  })

  const { data: partiesData } = useQuery({
    queryKey: ['parties-all'],
    queryFn: () => getParties({ size: 500 }).then((r) => r.data),
  })

  const leafAccounts = flattenLeafAccounts(accountsData ?? [])
  const parties: Party[] = partiesData ?? []

  const entries: JournalEntry[] = Array.isArray(journalData) ? journalData : []

  const columns: ColumnsType<JournalEntry> = [
    {
      title: 'JE No.',
      dataIndex: 'jeNo',
      key: 'jeNo',
      width: 120,
      render: (v: string) => <Text code>{v}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Narration',
      dataIndex: 'narration',
      key: 'narration',
    },
    {
      title: 'Type',
      dataIndex: 'entryType',
      key: 'entryType',
      width: 120,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: 'Total Debit',
      dataIndex: 'totalDebit',
      key: 'totalDebit',
      align: 'right',
      width: 140,
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
    {
      title: 'Total Credit',
      dataIndex: 'totalCredit',
      key: 'totalCredit',
      align: 'right',
      width: 140,
      render: (v: number) => <AmountDisplay amount={v ?? 0} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: string) => <StatusBadge status={v ?? 'POSTED'} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Journal Entries"
        subtitle="Manual journal entries and adjustments"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            New Journal Entry
          </Button>
        }
      />

      <Table<JournalEntry>
        dataSource={entries}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        size="small"
      />

      <JournalFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        leafAccounts={leafAccounts}
        parties={parties}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['journal-entries'] })}
      />
    </div>
  )
}
