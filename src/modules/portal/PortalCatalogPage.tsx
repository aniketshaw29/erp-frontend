import { useState, useCallback } from 'react'
import {
  Row,
  Col,
  Card,
  Input,
  Select,
  Button,
  Drawer,
  InputNumber,
  Typography,
  Space,
  Empty,
  Divider,
  message,
  Tag,
} from 'antd'
import { ShoppingCartOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import AmountDisplay from '../../components/AmountDisplay'
import { getPortalCatalog, placeOrder } from '../../api/modules/portal.api'

const { Search } = Input
const { Text, Title } = Typography
const { Option } = Select

interface CatalogItem {
  id: string
  name: string
  code: string
  gstRate: number
  sellingRate: number
  category?: string
  uom?: string
}

interface CartItem {
  item: CatalogItem
  qty: number
}

export default function PortalCatalogPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])

  const { data: catalogData, isLoading } = useQuery({
    queryKey: ['portal-catalog', search, category],
    queryFn: () =>
      getPortalCatalog({ search: search || undefined, category }).then((r) => r.data),
  })

  const items: CatalogItem[] = catalogData?.data ?? catalogData ?? []
  const categories: string[] = Array.from(
    new Set(items.map((i) => i.category).filter(Boolean) as string[]),
  )

  const cartTotal = cart.reduce((sum, ci) => sum + ci.item.sellingRate * ci.qty, 0)
  const cartCount = cart.reduce((sum, ci) => sum + ci.qty, 0)

  const addToCart = useCallback((item: CatalogItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id)
      if (existing) {
        return prev.map((ci) => (ci.item.id === item.id ? { ...ci, qty: ci.qty + 1 } : ci))
      }
      return [...prev, { item, qty: 1 }]
    })
  }, [])

  const updateQty = (itemId: string, qty: number | null) => {
    if (!qty || qty <= 0) {
      setCart((prev) => prev.filter((ci) => ci.item.id !== itemId))
      return
    }
    setCart((prev) => prev.map((ci) => (ci.item.id === itemId ? { ...ci, qty } : ci)))
  }

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.item.id !== itemId))
  }

  const orderMutation = useMutation({
    mutationFn: () =>
      placeOrder({
        items: cart.map((ci) => ({ itemId: ci.item.id, qty: ci.qty, rate: ci.item.sellingRate })),
      }),
    onSuccess: () => {
      message.success('Order placed successfully')
      setCart([])
      setCartOpen(false)
      navigate('/portal/orders')
    },
    onError: () => message.error('Failed to place order'),
  })

  return (
    <div>
      <PageHeader
        title="Wholesaler Catalog"
        subtitle="Browse and order items from your wholesaler"
        actions={
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={() => setCartOpen(true)}
          >
            Cart ({cartCount})
          </Button>
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={16}>
          <Search
            placeholder="Search items by name or code..."
            onSearch={(val) => setSearch(val)}
            onChange={(e) => !e.target.value && setSearch('')}
            allowClear
          />
        </Col>
        <Col xs={24} sm={8}>
          <Select
            placeholder="Filter by category"
            allowClear
            style={{ width: '100%' }}
            value={category}
            onChange={(val) => setCategory(val)}
          >
            {categories.map((cat) => (
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      {!isLoading && items.length === 0 ? (
        <Empty description="No items found" style={{ marginTop: 48 }} />
      ) : (
        <Row gutter={[16, 16]}>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Col key={i} xs={24} sm={12} md={8} lg={6}>
                  <Card loading />
                </Col>
              ))
            : items.map((item) => (
                <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    size="small"
                    hoverable
                    actions={[
                      <Button
                        key="add"
                        type="primary"
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={() => addToCart(item)}
                      >
                        Add to Order
                      </Button>,
                    ]}
                  >
                    <Title level={5} style={{ margin: 0, marginBottom: 4, fontSize: 14 }}>
                      {item.name}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                      {item.code}
                    </Text>
                    <Space size={4} wrap>
                      <Tag color="blue" style={{ fontSize: 11 }}>
                        GST {item.gstRate}%
                      </Tag>
                      {item.category && (
                        <Tag style={{ fontSize: 11 }}>{item.category}</Tag>
                      )}
                    </Space>
                    <div style={{ marginTop: 8, fontWeight: 600, fontSize: 15 }}>
                      <AmountDisplay amount={item.sellingRate} />
                      {item.uom && (
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                          / {item.uom}
                        </Text>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
        </Row>
      )}

      <Drawer
        title={`Cart (${cartCount} items)`}
        placement="right"
        width={400}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        footer={
          cart.length > 0 ? (
            <div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}
              >
                <Text strong>Total:</Text>
                <Text strong style={{ fontSize: 16 }}>
                  <AmountDisplay amount={cartTotal} />
                </Text>
              </div>
              <Button
                type="primary"
                block
                size="large"
                onClick={() => orderMutation.mutate()}
                loading={orderMutation.isPending}
              >
                Place Order
              </Button>
            </div>
          ) : null
        }
      >
        {cart.length === 0 ? (
          <Empty description="Cart is empty" style={{ marginTop: 48 }} />
        ) : (
          <div>
            {cart.map((ci) => (
              <div key={ci.item.id} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 13 }}>
                      {ci.item.name}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {ci.item.code} — <AmountDisplay amount={ci.item.sellingRate} />
                    </Text>
                  </div>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    onClick={() => removeFromCart(ci.item.id)}
                    style={{ marginLeft: 8 }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 8,
                  }}
                >
                  <InputNumber
                    min={1}
                    value={ci.qty}
                    onChange={(val) => updateQty(ci.item.id, val)}
                    size="small"
                    style={{ width: 80 }}
                  />
                  <Text style={{ color: '#1677ff', fontWeight: 600 }}>
                    <AmountDisplay amount={ci.item.sellingRate * ci.qty} />
                  </Text>
                </div>
                <Divider style={{ margin: '12px 0' }} />
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  )
}
