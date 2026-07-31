import { useState } from 'react'
import {
  Tree,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Tag,
  Tooltip,
  Dropdown,
  message,
  Spin,
  Empty,
  Typography,
} from 'antd'
import {
  PlusOutlined,
  LockOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DataNode } from 'antd/es/tree'
import type { MenuProps } from 'antd'
import PageHeader from '../../components/PageHeader'
import {
  getChartOfAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../../api/modules/accounts.api'

const { Text } = Typography

type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'

interface Account {
  id: string
  code: string
  name: string
  accountType: AccountType
  parentId: string | null
  isSystem: boolean
  isLeaf: boolean
  openingBalance?: number
  children?: Account[]
}

const accountTypeColors: Record<AccountType, string> = {
  ASSET: 'blue',
  LIABILITY: 'red',
  EQUITY: 'purple',
  INCOME: 'green',
  EXPENSE: 'orange',
}

function accountToTreeNode(account: Account, onAction: (action: string, acc: Account) => void): DataNode {
  const actions: MenuProps['items'] = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
    },
    ...(account.isLeaf
      ? []
      : [
          {
            key: 'add-child',
            icon: <PlusCircleOutlined />,
            label: 'Add Child',
          },
        ]),
    ...(!account.isSystem
      ? [
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
          },
        ]
      : []),
  ]

  return {
    key: account.id,
    title: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
        <Text style={{ fontFamily: 'monospace', color: '#888', fontSize: 12 }}>{account.code}</Text>
        <Text>{account.name}</Text>
        <Tag color={accountTypeColors[account.accountType]} style={{ fontSize: 11, padding: '0 4px', lineHeight: '16px' }}>
          {account.accountType}
        </Tag>
        {account.isSystem && (
          <Tooltip title="System account — cannot be deleted">
            <LockOutlined style={{ color: '#aaa', fontSize: 12 }} />
          </Tooltip>
        )}
        <Dropdown menu={{ items: actions, onClick: ({ key }) => onAction(key, account) }} trigger={['click']}>
          <MoreOutlined
            style={{ marginLeft: 'auto', cursor: 'pointer', color: '#aaa', padding: '0 4px' }}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>
    ),
    children: account.children?.map((c) => accountToTreeNode(c, onAction)),
  }
}

interface AccountDrawerProps {
  open: boolean
  mode: 'new' | 'edit' | 'add-child'
  initialData?: Account | null
  parentAccount?: Account | null
  allAccounts: Account[]
  onClose: () => void
  onSubmit: (data: any) => void
  loading: boolean
}

function buildFlatList(accounts: Account[]): Account[] {
  const result: Account[] = []
  function traverse(acc: Account) {
    result.push(acc)
    acc.children?.forEach(traverse)
  }
  accounts.forEach(traverse)
  return result
}

function AccountDrawer({
  open,
  mode,
  initialData,
  parentAccount,
  allAccounts,
  onClose,
  onSubmit,
  loading,
}: AccountDrawerProps) {
  const [form] = Form.useForm()

  const title =
    mode === 'new' ? 'New Account' : mode === 'add-child' ? `Add Child to "${parentAccount?.name}"` : `Edit "${initialData?.name}"`

  const handleFinish = (values: any) => {
    onSubmit({
      ...values,
      parentId: mode === 'add-child' ? parentAccount?.id : values.parentId ?? null,
    })
  }

  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      width={480}
      destroyOnClose
      afterOpenChange={(vis) => {
        if (vis && mode === 'edit' && initialData) {
          form.setFieldsValue({
            accountType: initialData.accountType,
            parentId: initialData.parentId ?? undefined,
            name: initialData.name,
            code: initialData.code,
            openingBalance: initialData.openingBalance ?? 0,
          })
        }
      }}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} loading={loading}>
            Save
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="accountType"
          label="Account Type"
          rules={[{ required: true, message: 'Select account type' }]}
        >
          <Select
            options={[
              { value: 'ASSET', label: 'Asset' },
              { value: 'LIABILITY', label: 'Liability' },
              { value: 'EQUITY', label: 'Equity' },
              { value: 'INCOME', label: 'Income' },
              { value: 'EXPENSE', label: 'Expense' },
            ]}
            placeholder="Select type"
            disabled={mode === 'edit' && !!initialData?.isSystem}
          />
        </Form.Item>

        {mode !== 'add-child' && (
          <Form.Item name="parentId" label="Parent Account">
            <Select
              showSearch
              allowClear
              placeholder="Select parent account (optional)"
              optionFilterProp="label"
              options={buildFlatList(allAccounts)
                .filter((a) => !a.isLeaf)
                .map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }))}
            />
          </Form.Item>
        )}

        <Form.Item name="name" label="Account Name" rules={[{ required: true, message: 'Enter account name' }]}>
          <Input placeholder="e.g. Cash in Hand" />
        </Form.Item>

        <Form.Item name="code" label="Account Code" rules={[{ required: true, message: 'Enter account code' }]}>
          <Input placeholder="e.g. 1001" />
        </Form.Item>

        <Form.Item name="openingBalance" label="Opening Balance" initialValue={0}>
          <InputNumber
            style={{ width: '100%' }}
            precision={2}
            prefix="₹"
            placeholder="0.00"
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default function ChartOfAccountsPage() {
  const queryClient = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'new' | 'edit' | 'add-child'>('new')
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [parentAccount, setParentAccount] = useState<Account | null>(null)

  const { data, isLoading } = useQuery<Account[]>({
    queryKey: ['chart-of-accounts'],
    queryFn: () => getChartOfAccounts().then((r) => r.data.data ?? r.data),
  })

  const allAccounts = data ?? []

  const createMutation = useMutation({
    mutationFn: (payload: any) => createAccount(payload),
    onSuccess: () => {
      message.success('Account created')
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] })
      setDrawerOpen(false)
    },
    onError: () => message.error('Failed to create account'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAccount(id, data),
    onSuccess: () => {
      message.success('Account updated')
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] })
      setDrawerOpen(false)
    },
    onError: () => message.error('Failed to update account'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => {
      message.success('Account deleted')
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] })
    },
    onError: () => message.error('Failed to delete account'),
  })

  const handleAction = (action: string, account: Account) => {
    if (action === 'edit') {
      setDrawerMode('edit')
      setSelectedAccount(account)
      setParentAccount(null)
      setDrawerOpen(true)
    } else if (action === 'add-child') {
      setDrawerMode('add-child')
      setSelectedAccount(null)
      setParentAccount(account)
      setDrawerOpen(true)
    } else if (action === 'delete') {
      if (account.isSystem) {
        message.warning('System accounts cannot be deleted')
        return
      }
      deleteMutation.mutate(account.id)
    }
  }

  const handleDrawerSubmit = (values: any) => {
    if (drawerMode === 'edit' && selectedAccount) {
      updateMutation.mutate({ id: selectedAccount.id, data: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  const treeData: DataNode[] = allAccounts.map((acc) => accountToTreeNode(acc, handleAction))

  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        subtitle="Manage your account hierarchy"
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setDrawerMode('new')
              setSelectedAccount(null)
              setParentAccount(null)
              setDrawerOpen(true)
            }}
          >
            New Account
          </Button>
        }
      />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : treeData.length === 0 ? (
        <Empty description="No accounts found" />
      ) : (
        <Tree
          treeData={treeData}
          defaultExpandAll
          showLine={{ showLeafIcon: false }}
          style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #f0f0f0' }}
        />
      )}

      <AccountDrawer
        open={drawerOpen}
        mode={drawerMode}
        initialData={selectedAccount}
        parentAccount={parentAccount}
        allAccounts={allAccounts}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleDrawerSubmit}
        loading={isMutating}
      />
    </div>
  )
}
