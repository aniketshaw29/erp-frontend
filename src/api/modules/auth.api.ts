import apiClient from '../client'
import type { LoginRequest, LoginResponse, RegisterRequest } from '../../types/auth.types'

export async function login(email: string, password: string): Promise<LoginResponse> {
  const payload: LoginRequest = { email, password }
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload)
  return data
}

export async function register(data: RegisterRequest): Promise<void> {
  await apiClient.post('/auth/register', data)
}

export async function refreshToken(token: string): Promise<{ accessToken: string }> {
  const { data } = await apiClient.post<{ accessToken: string }>('/auth/refresh', { refreshToken: token })
  return data
}
