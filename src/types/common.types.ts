export interface PageResponse<T> {
  success: boolean
  data: T[]
  meta: {
    page: number
    size: number
    total: number
    totalPages: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
  }
}
