import { Typography } from 'antd'

const { Title, Text } = Typography

export default function StubPage() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <Title level={3}>Coming Soon</Title>
      <Text type="secondary">This module is under development.</Text>
    </div>
  )
}
