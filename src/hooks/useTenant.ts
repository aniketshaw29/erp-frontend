import { useAuthStore } from '../store/authStore'

export function useTenant() {
  const tenantId = useAuthStore((s) => s.tenantId)
  const user = useAuthStore((s) => s.user)
  return {
    tenantId,
    tenantName: user?.tenantName || 'My Business',
  }
}
