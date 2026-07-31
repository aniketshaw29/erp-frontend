import apiClient from '../client'
import type { PageResponse } from '../../types/common.types'
import type { Invoice } from '../../types/sales.types'

export interface InvoiceQueryParams {
  page?: number
  size?: number
  status?: string
  customerId?: string
}

export async function getInvoices(params?: InvoiceQueryParams): Promise<PageResponse<Invoice>> {
  const { data } = await apiClient.get<PageResponse<Invoice>>('/api/v1/sales/invoices', { params })
  return data
}

export async function getInvoice(id: string): Promise<Invoice> {
  const { data } = await apiClient.get<{ data: Invoice }>(`/api/v1/sales/invoices/${id}`)
  return data.data
}

export async function createInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceNo'>): Promise<Invoice> {
  const { data } = await apiClient.post<{ data: Invoice }>('/api/v1/sales/invoices', invoiceData)
  return data.data
}

export async function getInvoicePdf(id: string): Promise<Blob> {
  const { data } = await apiClient.get(`/api/v1/sales/invoices/${id}/pdf`, {
    responseType: 'blob',
  })
  return data as Blob
}
