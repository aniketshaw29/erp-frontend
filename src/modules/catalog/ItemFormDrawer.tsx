import { useEffect } from 'react'
import {
  Drawer,
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  Switch,
  Space,
  message,
} from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createItem,
  updateItem,
  getItemCategories,
  getUoms,
  getHsnCodes,
} from '../../api/modules/catalog.api'
import type { Item } from '../../types/catalog.types'

const { Option } = Select

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  itemType: z.enum(['STOCK', 'CONSUMABLE', 'SERVICE'], { required_error: 'Item type is required' }),
  trackingType: z.enum(['NONE', 'BATCH', 'SERIAL']).default('NONE'),
  categoryId: z.string().optional(),
  uomId: z.string().optional(),
  hsnCodeId: z.string().optional(),
  standardRate: z.number().min(0).optional(),
  purchaseRate: z.number().min(0).optional(),
  mrp: z.number().min(0).optional(),
  reorderLevel: z.number().min(0).optional(),
  reorderQty: z.number().min(0).optional(),
  hasExpiry: z.boolean().optional(),
})

type ItemFormData = z.infer<typeof itemSchema>

interface ItemFormDrawerProps {
  open: boolean
  item: Item | null
  onClose: () => void
}

export default function ItemFormDrawer({ open, item, onClose }: ItemFormDrawerProps) {
  const queryClient = useQueryClient()
  const isEdit = item !== null

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      code: '',
      itemType: undefined,
      trackingType: 'NONE',
      categoryId: undefined,
      uomId: undefined,
      hsnCodeId: undefined,
      standardRate: undefined,
      purchaseRate: undefined,
      mrp: undefined,
      reorderLevel: undefined,
      reorderQty: undefined,
      hasExpiry: false,
    },
  })

  const watchedItemType = watch('itemType')
  const watchedTrackingType = watch('trackingType')
  const showStockFields = watchedItemType === 'STOCK'
  const showExpiryField = watchedTrackingType === 'BATCH'

  const { data: categories } = useQuery({
    queryKey: ['item-categories'],
    queryFn: getItemCategories,
    enabled: open,
  })

  const { data: uoms } = useQuery({
    queryKey: ['uoms'],
    queryFn: getUoms,
    enabled: open,
  })

  const { data: hsnCodes } = useQuery({
    queryKey: ['hsn-codes'],
    queryFn: () => getHsnCodes(),
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      if (item) {
        reset({
          name: item.name,
          code: item.code ?? '',
          itemType: item.itemType,
          trackingType: item.trackingType,
          categoryId: item.categoryId,
          uomId: item.uomId,
          hsnCodeId: item.hsnCodeId,
          standardRate: item.standardRate,
          purchaseRate: item.purchaseRate,
          mrp: item.mrp,
          reorderLevel: item.reorderLevel,
          reorderQty: item.reorderQty,
          hasExpiry: item.hasExpiry ?? false,
        })
      } else {
        reset({
          name: '',
          code: '',
          itemType: undefined,
          trackingType: 'NONE',
          categoryId: undefined,
          uomId: undefined,
          hsnCodeId: undefined,
          standardRate: undefined,
          purchaseRate: undefined,
          mrp: undefined,
          reorderLevel: undefined,
          reorderQty: undefined,
          hasExpiry: false,
        })
      }
    }
  }, [open, item, reset])

  const createMutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      message.success('Item created successfully')
      queryClient.invalidateQueries({ queryKey: ['items'] })
      onClose()
    },
    onError: () => {
      message.error('Failed to create item')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ItemFormData }) => updateItem(id, data),
    onSuccess: () => {
      message.success('Item updated successfully')
      queryClient.invalidateQueries({ queryKey: ['items'] })
      onClose()
    },
    onError: () => {
      message.error('Failed to update item')
    },
  })

  const onSubmit = async (data: ItemFormData) => {
    const payload = {
      ...data,
      code: data.code || undefined,
    }
    if (isEdit && item) {
      updateMutation.mutate({ id: item.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const loading = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <Drawer
      title={isEdit ? 'Edit Item' : 'New Item'}
      open={open}
      onClose={onClose}
      width={600}
      destroyOnClose
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={handleSubmit(onSubmit)} loading={loading}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </Space>
        </div>
      }
    >
      <Form layout="vertical">
        <Form.Item
          label="Name"
          required
          validateStatus={errors.name ? 'error' : undefined}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Item name" />}
          />
        </Form.Item>

        <Form.Item
          label="Item Code"
          validateStatus={errors.code ? 'error' : undefined}
          help={errors.code?.message ?? 'Auto-generated if left blank'}
        >
          <Controller
            name="code"
            control={control}
            render={({ field }) => <Input {...field} placeholder="e.g. ITEM-001" />}
          />
        </Form.Item>

        <Form.Item
          label="Item Type"
          required
          validateStatus={errors.itemType ? 'error' : undefined}
          help={errors.itemType?.message}
        >
          <Controller
            name="itemType"
            control={control}
            render={({ field }) => (
              <Select {...field} placeholder="Select item type" style={{ width: '100%' }}>
                <Option value="STOCK">Stock</Option>
                <Option value="CONSUMABLE">Consumable</Option>
                <Option value="SERVICE">Service</Option>
              </Select>
            )}
          />
        </Form.Item>

        <Form.Item
          label="Category"
          validateStatus={errors.categoryId ? 'error' : undefined}
          help={errors.categoryId?.message}
        >
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select category"
                style={{ width: '100%' }}
                allowClear
                showSearch
                filterOption={(input, opt) =>
                  String(opt?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {categories?.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            )}
          />
        </Form.Item>

        <Form.Item
          label="Unit of Measure (UOM)"
          validateStatus={errors.uomId ? 'error' : undefined}
          help={errors.uomId?.message}
        >
          <Controller
            name="uomId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select UOM"
                style={{ width: '100%' }}
                allowClear
                showSearch
                filterOption={(input, opt) =>
                  String(opt?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {uoms?.map((u) => (
                  <Option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </Option>
                ))}
              </Select>
            )}
          />
        </Form.Item>

        <Form.Item
          label="HSN Code"
          validateStatus={errors.hsnCodeId ? 'error' : undefined}
          help={errors.hsnCodeId?.message}
        >
          <Controller
            name="hsnCodeId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Search HSN code"
                style={{ width: '100%' }}
                allowClear
                showSearch
                filterOption={(input, opt) =>
                  String(opt?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {hsnCodes?.map((h) => (
                  <Option key={h.id} value={h.id}>
                    {h.code} — {h.description} ({h.gstRate}%)
                  </Option>
                ))}
              </Select>
            )}
          />
        </Form.Item>

        <Form.Item
          label="Tracking Type"
          validateStatus={errors.trackingType ? 'error' : undefined}
          help={errors.trackingType?.message}
        >
          <Controller
            name="trackingType"
            control={control}
            render={({ field }) => (
              <Select {...field} style={{ width: '100%' }}>
                <Option value="NONE">None</Option>
                <Option value="BATCH">Batch</Option>
                <Option value="SERIAL">Serial</Option>
              </Select>
            )}
          />
        </Form.Item>

        {showExpiryField && (
          <Form.Item label="Has Expiry">
            <Controller
              name="hasExpiry"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                />
              )}
            />
          </Form.Item>
        )}

        <Form.Item
          label="Selling Rate (₹)"
          validateStatus={errors.standardRate ? 'error' : undefined}
          help={errors.standardRate?.message}
        >
          <Controller
            name="standardRate"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
                placeholder="0.00"
                prefix="₹"
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Purchase Rate (₹)"
          validateStatus={errors.purchaseRate ? 'error' : undefined}
          help={errors.purchaseRate?.message}
        >
          <Controller
            name="purchaseRate"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
                placeholder="0.00"
                prefix="₹"
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="MRP (₹)"
          validateStatus={errors.mrp ? 'error' : undefined}
          help={errors.mrp?.message}
        >
          <Controller
            name="mrp"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
                placeholder="0.00"
                prefix="₹"
              />
            )}
          />
        </Form.Item>

        {showStockFields && (
          <>
            <Form.Item
              label="Reorder Level"
              validateStatus={errors.reorderLevel ? 'error' : undefined}
              help={errors.reorderLevel?.message}
            >
              <Controller
                name="reorderLevel"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="Minimum stock before reorder alert"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Reorder Quantity"
              validateStatus={errors.reorderQty ? 'error' : undefined}
              help={errors.reorderQty?.message}
            >
              <Controller
                name="reorderQty"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="Default quantity to reorder"
                  />
                )}
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Drawer>
  )
}
