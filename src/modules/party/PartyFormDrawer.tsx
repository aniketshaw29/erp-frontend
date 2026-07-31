import { useEffect } from 'react'
import { Drawer, Form, Input, Button, Select, InputNumber, Space, message } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createParty, updateParty } from '../../api/modules/party.api'
import type { Party } from '../../types/party.types'

const { Option } = Select

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

const partySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  partyType: z.enum(['VENDOR', 'CUSTOMER', 'BOTH'], { required_error: 'Party type is required' }),
  gstin: z
    .string()
    .optional()
    .refine((v) => !v || GSTIN_REGEX.test(v), 'Invalid GSTIN format'),
  pan: z
    .string()
    .optional()
    .refine((v) => !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v), 'Invalid PAN format'),
  phone: z.string().optional(),
  email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  creditLimit: z.number().min(0).optional(),
  creditDays: z.number().min(0).max(365).optional(),
  paymentTerms: z.enum(['NET30', 'NET60', 'NET90', 'COD', 'ADVANCE']).optional(),
})

type PartyFormData = z.infer<typeof partySchema>

interface PartyFormDrawerProps {
  open: boolean
  party: Party | null
  onClose: () => void
}

export default function PartyFormDrawer({ open, party, onClose }: PartyFormDrawerProps) {
  const queryClient = useQueryClient()
  const isEdit = party !== null

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartyFormData>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      name: '',
      partyType: undefined,
      gstin: '',
      pan: '',
      phone: '',
      email: '',
      creditLimit: 0,
      creditDays: undefined,
      paymentTerms: undefined,
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (party) {
        reset({
          name: party.name,
          partyType: party.partyType,
          gstin: party.gstin ?? '',
          pan: party.pan ?? '',
          phone: party.phone ?? '',
          email: party.email ?? '',
          creditLimit: party.creditLimit ?? 0,
          creditDays: party.creditDays,
          paymentTerms: party.paymentTerms,
        })
      } else {
        reset({
          name: '',
          partyType: undefined,
          gstin: '',
          pan: '',
          phone: '',
          email: '',
          creditLimit: 0,
          creditDays: undefined,
          paymentTerms: undefined,
        })
      }
    }
  }, [open, party, reset])

  const createMutation = useMutation({
    mutationFn: createParty,
    onSuccess: () => {
      message.success('Party created successfully')
      queryClient.invalidateQueries({ queryKey: ['parties'] })
      onClose()
    },
    onError: () => {
      message.error('Failed to create party')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PartyFormData }) =>
      updateParty(id, data),
    onSuccess: () => {
      message.success('Party updated successfully')
      queryClient.invalidateQueries({ queryKey: ['parties'] })
      onClose()
    },
    onError: () => {
      message.error('Failed to update party')
    },
  })

  const onSubmit = async (data: PartyFormData) => {
    const payload = {
      ...data,
      gstin: data.gstin || undefined,
      pan: data.pan || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
    }
    if (isEdit && party) {
      updateMutation.mutate({ id: party.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const loading = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <Drawer
      title={isEdit ? 'Edit Party' : 'New Party'}
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
            render={({ field }) => <Input {...field} placeholder="Party name" />}
          />
        </Form.Item>

        <Form.Item
          label="Party Type"
          required
          validateStatus={errors.partyType ? 'error' : undefined}
          help={errors.partyType?.message}
        >
          <Controller
            name="partyType"
            control={control}
            render={({ field }) => (
              <Select {...field} placeholder="Select party type" style={{ width: '100%' }}>
                <Option value="VENDOR">Vendor</Option>
                <Option value="CUSTOMER">Customer</Option>
                <Option value="BOTH">Both</Option>
              </Select>
            )}
          />
        </Form.Item>

        <Form.Item
          label="GSTIN"
          validateStatus={errors.gstin ? 'error' : undefined}
          help={errors.gstin?.message ?? 'Optional — format: 22AAAAA0000A1Z5'}
        >
          <Controller
            name="gstin"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="22AAAAA0000A1Z5"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="PAN"
          validateStatus={errors.pan ? 'error' : undefined}
          help={errors.pan?.message ?? 'Optional — format: AAAAA0000A'}
        >
          <Controller
            name="pan"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="AAAAA0000A"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Phone"
          validateStatus={errors.phone ? 'error' : undefined}
          help={errors.phone?.message}
        >
          <Controller
            name="phone"
            control={control}
            render={({ field }) => <Input {...field} placeholder="+91 98765 43210" />}
          />
        </Form.Item>

        <Form.Item
          label="Email"
          validateStatus={errors.email ? 'error' : undefined}
          help={errors.email?.message}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => <Input {...field} type="email" placeholder="contact@example.com" />}
          />
        </Form.Item>

        <Form.Item
          label="Credit Limit (₹)"
          validateStatus={errors.creditLimit ? 'error' : undefined}
          help={errors.creditLimit?.message}
        >
          <Controller
            name="creditLimit"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={0}
                step={1000}
                style={{ width: '100%' }}
                formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => Number(v!.replace(/₹\s?|(,*)/g, ''))}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Credit Days"
          validateStatus={errors.creditDays ? 'error' : undefined}
          help={errors.creditDays?.message}
        >
          <Controller
            name="creditDays"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={0}
                max={365}
                style={{ width: '100%' }}
                placeholder="e.g. 30"
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Payment Terms"
          validateStatus={errors.paymentTerms ? 'error' : undefined}
          help={errors.paymentTerms?.message}
        >
          <Controller
            name="paymentTerms"
            control={control}
            render={({ field }) => (
              <Select {...field} placeholder="Select payment terms" style={{ width: '100%' }} allowClear>
                <Option value="NET30">Net 30</Option>
                <Option value="NET60">Net 60</Option>
                <Option value="NET90">Net 90</Option>
                <Option value="COD">Cash on Delivery</Option>
                <Option value="ADVANCE">Advance</Option>
              </Select>
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
