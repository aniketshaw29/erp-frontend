import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const tenantId = useAuthStore((s) => s.tenantId)
  const token = useAuthStore((s) => s.token)

  return {
    user,
    tenantId,
    token,
    isAuthenticated: !!token,
  }
}
