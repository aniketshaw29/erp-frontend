export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    email: string
    name: string
    tenantId: string
    tenantName: string
  }
}

export interface RegisterRequest {
  businessName: string
  gstin: string
  email: string
  password: string
}
