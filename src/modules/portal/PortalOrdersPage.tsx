import { useState } from 'react'
import { Drawer, Table, Typography, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import ErpTable from '../../components/ErpTable'
import AmountDisplay from '../../components/AmountDisplay'
import StatusBadge from '../../components/StatusBadge'
import { getMyOrders, getMyOrder } from '../../api/modules/portal.api'
import { usePagination } from '../../hooks/usePagination'

const { Text } = Typography

interface OrderLine {
  id: string
  itemName: string
  itemCode: string
  qty: number
  rate: number
  amount: number
}

interface Order {
  id: string
  orderNo: string
  date: string
  itemCount: number
  totalAmount: number
  status: string
  lines?: OrderLine[]
}

export default function PortalOrdersPage() {
  const { page, pageSize, onPageChange } = usePagination()
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['portal-orders', page, pageSize],
    queryFn: () => getMyOrders({ page, size: pageSize }).then((r) => r.data),
  })

  const { data: orderDetailData, isLoading: detailLoading } = useQuery({
    queryKey: ['portal-order-detail', selectedOrderId],
    queryFn: () => getMyOrder(selectedOrderId!).then((r) => r.data),
    enabled: !!selectedOrderId,
  })

  const orders: Order[] = ordersData?.data ?? ordersData ?? []
  const totalCount: number = ordersData?.meta?.total ?? orders.length
  const orderDetail: Order | null = orderDetailData?.data ?? orderDetailData ?? null

  const columns: ColumnsType<Order> = [
    {
      title: 'Order No',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (val: string) => <Text strong>{val}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Items',
      dataIndex: 'itemCount',
      key: 'itemCount',
      render: (count: number) => <Tag>{count} items</Tag>,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (amount: number) => <AmountDisplay amount={amount} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
  ]

  const lineColumns: ColumnsType<OrderLine> = [
    {
      title: 'Item',
      key: 'item',
      render: (_: unknown, record) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {record.itemName}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.itemCode}
          </Text>
        </div>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      align: 'right',
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      align: 'right',
      render: (rate: number) => <AmountDisplay amount={rate} />,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount: number) => <AmountDisplay amount={amount} />,
    },
  ]

  return (
    <div>
      <PageHeader title="My Orders" subtitle="Orders placed with your wholesaler" />

      <ErpTable<Order>
        columns={columns}
        dataSource={orders}
        loading={isLoading}
        rowKey="id"
        pagination={{ total: totalCount, page, pageSize }}
        onPageChange={onPageChange}
        onRowClick={(record) => setSelectedOrderId(record.id)}
      />

      <Drawer
        title={
          orderDetail
            ? `Order ${orderDetail.orderNo}`
            : 'Order Details'
        }
        placement="right"
        width={560}
        open={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      >
        {orderDetail && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Date: {dayjs(orderDetail.date).format('DD/MM/YYYY')}
              </Text>
              <div style={{ marginTop: 4 }}>
                <StatusBadge status={orderDetail.status} />
              </div>
            </div>
            <Table<OrderLine>
              columns={lineColumns}
              dataSource={orderDetail.lines ?? []}
              rowKey="id"
              pagination={false}
              loading={detailLoading}
              size="small"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong>Total</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong>
                      <AmountDisplay amount={orderDetail.totalAmount} />
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
        )}
      </Drawer>
    </div>
  )
}
