import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, Form, Input, Button, Typography, Alert } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { register as registerApi } from '../api/modules/auth.api'

const { Title, Text } = Typography

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

const registerSchema = z
  .object({
    businessName: z.string().min(2, 'Business name must be at least 2 characters'),
    gstin: z
      .string()
      .optional()
      .refine(
        (v) => !v || GSTIN_REGEX.test(v),
        'Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)',
      ),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: '',
      gstin: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)
    try {
      await registerApi({
        businessName: data.businessName,
        gstin: data.gstin ?? '',
        email: data.email,
        password: data.password,
      })
      navigate('/login', {
        state: { message: 'Account created successfully. Please sign in.' },
      })
    } catch {
      setError('Registration failed. Please try again.')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
        padding: '24px 0',
      }}
    >
      <Card style={{ width: 440, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: '#1677ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontSize: 24,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            E
          </div>
          <Title level={3} style={{ margin: 0 }}>
            Create Account
          </Title>
          <Text type="secondary">Set up your ERP business account</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label="Business Name"
            required
            validateStatus={errors.businessName ? 'error' : undefined}
            help={errors.businessName?.message}
          >
            <Controller
              name="businessName"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Your Business Name" size="large" />
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
                  placeholder="22AAAAA0000A1Z5 (optional)"
                  size="large"
                  style={{ textTransform: 'uppercase' }}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Admin Email"
            required
            validateStatus={errors.email ? 'error' : undefined}
            help={errors.email?.message}
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input {...field} type="email" placeholder="you@example.com" size="large" />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            required
            validateStatus={errors.password ? 'error' : undefined}
            help={errors.password?.message}
          >
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password {...field} placeholder="At least 8 characters" size="large" />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            required
            validateStatus={errors.confirmPassword ? 'error' : undefined}
            help={errors.confirmPassword?.message}
          >
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <Input.Password {...field} placeholder="Repeat your password" size="large" />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              block
              size="large"
            >
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}
