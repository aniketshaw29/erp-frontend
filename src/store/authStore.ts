import { create } from 'zustand'

export interface User {
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
  refreshToken: string | null
  setAuth: (user: User, tenantId: string, token: string, refreshToken: string) => void
  clearAuth: () => void
  initFromStorage: () => void
}

const TOKEN_KEY = 'erp_access_token'
const REFRESH_KEY = 'erp_refresh_token'
const USER_KEY = 'erp_user'
const TENANT_KEY = 'erp_tenant_id'

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenantId: null,
  token: null,
  refreshToken: null,

  setAuth: (user, tenantId, token, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(REFRESH_KEY, refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    localStorage.setItem(TENANT_KEY, tenantId)
    set({ user, tenantId, token, refreshToken })
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TENANT_KEY)
    set({ user: null, tenantId: null, token: null, refreshToken: null })
  },

  initFromStorage: () => {
    const token = localStorage.getItem(TOKEN_KEY)
    const refreshToken = localStorage.getItem(REFRESH_KEY)
    const tenantId = localStorage.getItem(TENANT_KEY)
    const userRaw = localStorage.getItem(USER_KEY)
    if (token && userRaw) {
      try {
        const user: User = JSON.parse(userRaw)
        set({ user, tenantId, token, refreshToken })
      } catch {
        // corrupted storage — clear it
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_KEY)
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(TENANT_KEY)
      }
    }
  },
}))
