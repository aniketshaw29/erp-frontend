import { Table, Empty } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'

interface ErpTableProps<T extends object> {
  columns: ColumnsType<T>
  dataSource: T[] | undefined
  loading: boolean
  pagination: {
    total: number
    page: number
    pageSize: number
  }
  onPageChange: (page: number, pageSize: number) => void
  rowKey?: string | ((record: T) => string)
  onRowClick?: (record: T) => void
}

export default function ErpTable<T extends object>({
  columns,
  dataSource,
  loading,
  pagination,
  onPageChange,
  rowKey = 'id',
  onRowClick,
}: ErpTableProps<T>) {
  const paginationConfig: TablePaginationConfig = {
    current: pagination.page,
    pageSize: pagination.pageSize,
    total: pagination.total,
    onChange: onPageChange,
    onShowSizeChange: onPageChange,
    showSizeChanger: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`,
    pageSizeOptions: ['10', '20', '50', '100'],
  }

  return (
    <Table<T>
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      pagination={paginationConfig}
      rowKey={rowKey}
      scroll={{ x: 'max-content' }}
      onRow={onRowClick ? (record) => ({ onClick: () => onRowClick(record), style: { cursor: 'pointer' } }) : undefined}
      locale={{
        emptyText: <Empty description="No records found" />,
      }}
    />
  )
}
