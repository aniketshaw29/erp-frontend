import { Badge } from 'antd'
import type { BadgeProps } from 'antd'

type StatusType = 'DRAFT' | 'SUBMITTED' | 'PAID' | 'CANCELLED' | 'PARTIAL' | string

const statusColorMap: Record<string, BadgeProps['status']> = {
  DRAFT: 'default',
  SUBMITTED: 'processing',
  PAID: 'success',
  CANCELLED: 'error',
  PARTIAL: 'warning',
}

interface StatusBadgeProps {
  status: StatusType
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = statusColorMap[status] ?? 'default'
  const label = status.charAt(0) + status.slice(1).toLowerCase()
  return <Badge status={color} text={label} />
}
