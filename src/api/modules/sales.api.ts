import apiClient from '../client'
import type { PageResponse } from '../../types/common.types'
import type { Invoice, Payment, CreditNote, AgingRow, OutstandingRow } from '../../types/sales.types'

export interface InvoiceQueryParams {
  page?: number
  size?: number
  status?: string
  customerId?: string
}

export const getSalesOrders = (params?: any) =>
  apiClient.get('/api/v1/sales/orders', { params })

export const createSalesOrder = (data: any) =>
  apiClient.post('/api/v1/sales/orders', data)

export const getInvoices = (params?: InvoiceQueryParams) =>
  apiClient.get<PageResponse<Invoice>>('/api/v1/sales/invoices', { params })

export const getInvoice = (id: string) =>
  apiClient.get<{ data: Invoice }>(`/api/v1/sales/invoices/${id}`)

export const createInvoice = (data: any) =>
  apiClient.post<{ data: Invoice }>('/api/v1/sales/invoices', data)

export const updateInvoice = (id: string, data: any) =>
  apiClient.put<{ data: Invoice }>(`/api/v1/sales/invoices/${id}`, data)

export const submitInvoice = (id: string) =>
  apiClient.post<{ data: Invoice }>(`/api/v1/sales/invoices/${id}/submit`)

export const cancelInvoice = (id: string) =>
  apiClient.post<{ data: Invoice }>(`/api/v1/sales/invoices/${id}/cancel`)

export const getInvoicePdf = (id: string) =>
  apiClient.get(`/api/v1/sales/invoices/${id}/pdf`, { responseType: 'blob' })

export const receivePayment = (data: any) =>
  apiClient.post<{ data: Payment }>('/api/v1/sales/payments', data)

export const getCustomerOutstanding = () =>
  apiClient.get<{ data: OutstandingRow[] }>('/api/v1/sales/outstanding')

export const getAgingReport = () =>
  apiClient.get<{ data: AgingRow[] }>('/api/v1/sales/aging')

export const getCreditNotes = (params?: any) =>
  apiClient.get<PageResponse<CreditNote>>('/api/v1/sales/credit-notes', { params })

export const createCreditNote = (data: any) =>
  apiClient.post<{ data: CreditNote }>('/api/v1/sales/credit-notes', data)

export const getStockBatches = (itemId: string) =>
  apiClient.get<{ data: StockBatch[] }>('/api/v1/stock/batches', { params: { itemId } })

export interface StockBatch {
  id: string
  batchNo: string
  itemId: string
  warehouseId: string
  warehouseName: string
  qty: number
  mrp: number
  expiryDate?: string
  mfgDate?: string
}
