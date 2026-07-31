import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  tenantId: string
  tenantName: string
}

interface AuthState {
  user: User | null
  tenantId: string | null
  token: string | null
  setAuth: (user: User, tenantId: string, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenantId: null,
      token: null,
      setAuth: (user, tenantId, token) => {
        localStorage.setItem('erp_access_token', token)
        set({ user, tenantId, token })
      },
      clearAuth: () => {
        localStorage.removeItem('erp_access_token')
        set({ user: null, tenantId: null, token: null })
      },
    }),
    {
      name: 'erp-auth',
      partialize: (state) => ({
        user: state.user,
        tenantId: state.tenantId,
        token: state.token,
      }),
    },
  ),
)
