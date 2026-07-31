import { useState, useEffect } from 'react'
import {
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Button,
  Card,
  Space,
  Divider,
  Typography,
  message,
  Row,
  Col,
  Alert,
} from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { useQuery, useMutation } from '@tanstack/react-query'
import PageHeader from '../../components/PageHeader'
import { getGstConfig, updateGstConfig, validateGstin } from '../../api/modules/gst.api'

const { Text } = Typography

interface GstinValidationResult {
  valid: boolean
  state?: string
  pan?: string
  message?: string
}

export default function GstConfigPage() {
  const [form] = Form.useForm()
  const [eInvoiceEnabled, setEInvoiceEnabled] = useState(false)
  const [gstinInput, setGstinInput] = useState('')
  const [validationResult, setValidationResult] = useState<GstinValidationResult | null>(null)
  const [validating, setValidating] = useState(false)

  const { data: configData, isLoading } = useQuery({
    queryKey: ['gst-config'],
    queryFn: () => getGstConfig().then((r) => r.data),
  })

  useEffect(() => {
    if (!configData) return
    const config = configData?.data ?? configData
    form.setFieldsValue({
      registrationType: config?.registrationType ?? 'REGULAR',
      eInvoiceEnabled: config?.eInvoiceEnabled ?? false,
      eInvoiceThreshold: config?.eInvoiceThreshold ?? 50000000,
      irpUsername: config?.irpUsername ?? '',
      eWayBillEnabled: config?.eWayBillEnabled ?? false,
      eWayBillThreshold: config?.eWayBillThreshold ?? 50000,
    })
    setEInvoiceEnabled(config?.eInvoiceEnabled ?? false)
  }, [configData, form])

  const saveMutation = useMutation({
    mutationFn: (values: any) => updateGstConfig(values),
    onSuccess: () => message.success('GST configuration saved'),
    onError: () => message.error('Failed to save GST configuration'),
  })

  const handleSave = async () => {
    const values = await form.validateFields()
    saveMutation.mutate(values)
  }

  const handleValidateGstin = async () => {
    const gstin = gstinInput.trim().toUpperCase()
    if (!gstin) {
      message.warning('Enter a GSTIN to validate')
      return
    }
    setValidating(true)
    setValidationResult(null)
    try {
      const res = await validateGstin(gstin)
      const data = res.data?.data ?? res.data
      setValidationResult({
        valid: data?.valid ?? true,
        state: data?.state,
        pan: data?.pan,
      })
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 400 || status === 422) {
        setValidationResult({ valid: false, message: 'Invalid format' })
      } else {
        setValidationResult({ valid: false, message: 'Validation failed' })
      }
    } finally {
      setValidating(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="GST Configuration"
        subtitle="Configure your GST registration and compliance settings"
        actions={
          <Button
            type="primary"
            onClick={handleSave}
            loading={saveMutation.isPending}
          >
            Save Configuration
          </Button>
        }
      />

      <Form form={form} layout="vertical" disabled={isLoading}>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Card title="Registration" style={{ marginBottom: 24 }}>
              <Form.Item
                name="registrationType"
                label="Registration Type"
                rules={[{ required: true, message: 'Select registration type' }]}
              >
                <Select
                  options={[
                    { value: 'REGULAR', label: 'Regular' },
                    { value: 'COMPOSITION', label: 'Composition' },
                    { value: 'EXEMPT', label: 'Exempt' },
                  ]}
                  placeholder="Select type"
                />
              </Form.Item>
            </Card>

            <Card title="E-Way Bill" style={{ marginBottom: 24 }}>
              <Form.Item
                name="eWayBillEnabled"
                label="Enable E-Way Bill"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                name="eWayBillThreshold"
                label="E-Way Bill Threshold (₹)"
                tooltip="Generate E-Way Bill for consignments above this value"
              >
                <InputNumber
                  min={0}
                  precision={0}
                  formatter={(val) => `₹ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(val) => val!.replace(/₹\s?|(,*)/g, '') as any}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="E-Invoicing" style={{ marginBottom: 24 }}>
              <Form.Item
                name="eInvoiceEnabled"
                label="Enable E-Invoicing"
                valuePropName="checked"
              >
                <Switch
                  onChange={(checked) => setEInvoiceEnabled(checked)}
                />
              </Form.Item>
              <Form.Item
                name="eInvoiceThreshold"
                label="E-Invoice Threshold (₹)"
                tooltip="Generate IRN for invoices above this value"
              >
                <InputNumber
                  min={0}
                  precision={0}
                  formatter={(val) => `₹ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(val) => val!.replace(/₹\s?|(,*)/g, '') as any}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item
                name="irpUsername"
                label="IRP Username"
                tooltip="Your username on the Invoice Registration Portal"
              >
                <Input placeholder="IRP username" autoComplete="off" />
              </Form.Item>
              {eInvoiceEnabled && (
                <Form.Item
                  name="irpPassword"
                  label="IRP Password"
                  tooltip="Your password on the Invoice Registration Portal"
                >
                  <Input.Password placeholder="IRP password" autoComplete="new-password" />
                </Form.Item>
              )}
            </Card>
          </Col>
        </Row>

        <Divider orientation="left">
          <Space>
            <SafetyCertificateOutlined />
            GSTIN Validator
          </Space>
        </Divider>

        <Card style={{ marginBottom: 24 }}>
          <Space.Compact style={{ width: '100%', maxWidth: 480 }}>
            <Input
              placeholder="Enter GSTIN (e.g. 27ABCDE1234F1Z5)"
              value={gstinInput}
              onChange={(e) => {
                setGstinInput(e.target.value.toUpperCase())
                setValidationResult(null)
              }}
              onPressEnter={handleValidateGstin}
              maxLength={15}
              style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
            />
            <Button
              type="primary"
              onClick={handleValidateGstin}
              loading={validating}
            >
              Validate
            </Button>
          </Space.Compact>

          {validationResult && (
            <div style={{ marginTop: 16 }}>
              {validationResult.valid ? (
                <Alert
                  type="success"
                  icon={<CheckCircleOutlined />}
                  showIcon
                  message={
                    <Text>
                      Valid
                      {validationResult.state && (
                        <> — State: <Text strong>{validationResult.state}</Text></>
                      )}
                      {validationResult.pan && (
                        <> | PAN: <Text strong style={{ fontFamily: 'monospace' }}>{validationResult.pan}</Text></>
                      )}
                    </Text>
                  }
                />
              ) : (
                <Alert
                  type="error"
                  icon={<CloseCircleOutlined />}
                  showIcon
                  message={validationResult.message ?? 'Invalid GSTIN'}
                />
              )}
            </div>
          )}
        </Card>
      </Form>
    </div>
  )
}
