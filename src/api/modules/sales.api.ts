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
  const { data } = await apiClient.get<PageResponse<Invoice>>('/sales/invoices', { params })
  return data
}

export async function getInvoice(id: string): Promise<Invoice> {
  const { data } = await apiClient.get<{ data: Invoice }>(`/sales/invoices/${id}`)
  return data.data
}

export async function createInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceNo'>): Promise<Invoice> {
  const { data } = await apiClient.post<{ data: Invoice }>('/sales/invoices', invoiceData)
  return data.data
}

export async function getInvoicePdf(id: string): Promise<Blob> {
  const { data } = await apiClient.get(`/sales/invoices/${id}/pdf`, {
    responseType: 'blob',
  })
  return data as Blob
}
