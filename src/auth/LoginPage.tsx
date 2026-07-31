import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, Form, Input, Button, Typography, Alert } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { login } from '../api/modules/auth.api'
import { useAuthStore } from '../store/authStore'

const { Title, Text } = Typography

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    try {
      const response = await login(data.email, data.password)
      setAuth(
        response.user,
        response.user.tenantId,
        response.accessToken,
        response.refreshToken,
      )
      navigate('/')
    } catch {
      setError('Invalid email or password. Please try again.')
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
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {/* Logo placeholder */}
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
            ERP Platform
          </Title>
          <Text type="secondary">Sign in to your account</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label="Email"
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
            validateStatus={errors.password ? 'error' : undefined}
            help={errors.password?.message}
          >
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password {...field} placeholder="Your password" size="large" />
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
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Don&apos;t have an account?{' '}
            <Link to="/register">Create an account</Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}
