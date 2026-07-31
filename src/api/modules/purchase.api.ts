import apiClient from '../client'
import type { PageResponse } from '../../types/common.types'
import type { PurchaseOrder, Grn, PurchaseBill } from '../../types/purchase.types'

export interface PurchaseOrderQueryParams {
  page?: number
  size?: number
  status?: string
  supplierId?: string
}

export const getPurchaseOrders = (params?: PurchaseOrderQueryParams) =>
  apiClient.get<PageResponse<PurchaseOrder>>('/api/v1/purchase/orders', { params })

export const getPurchaseOrder = (id: string) =>
  apiClient.get<{ data: PurchaseOrder }>(`/api/v1/purchase/orders/${id}`)

export const createPurchaseOrder = (data: any) =>
  apiClient.post<{ data: PurchaseOrder }>('/api/v1/purchase/orders', data)

export const updatePurchaseOrder = (id: string, data: any) =>
  apiClient.put<{ data: PurchaseOrder }>(`/api/v1/purchase/orders/${id}`, data)

export const submitPurchaseOrder = (id: string) =>
  apiClient.post<{ data: PurchaseOrder }>(`/api/v1/purchase/orders/${id}/submit`)

export const cancelPurchaseOrder = (id: string) =>
  apiClient.post<{ data: PurchaseOrder }>(`/api/v1/purchase/orders/${id}/cancel`)

export const getGrns = (params?: any) =>
  apiClient.get<PageResponse<Grn>>('/api/v1/purchase/grns', { params })

export const getGrn = (id: string) =>
  apiClient.get<{ data: Grn }>(`/api/v1/purchase/grns/${id}`)

export const createGrn = (data: any) =>
  apiClient.post<{ data: Grn }>('/api/v1/purchase/grns', data)

export const submitGrn = (id: string) =>
  apiClient.post<{ data: Grn }>(`/api/v1/purchase/grns/${id}/submit`)

export const getPurchaseBills = (params?: any) =>
  apiClient.get<PageResponse<PurchaseBill>>('/api/v1/purchase/bills', { params })

export const getPurchaseBill = (id: string) =>
  apiClient.get<{ data: PurchaseBill }>(`/api/v1/purchase/bills/${id}`)

export const createPurchaseBill = (data: any) =>
  apiClient.post<{ data: PurchaseBill }>('/api/v1/purchase/bills', data)

export const submitPurchaseBill = (id: string) =>
  apiClient.post<{ data: PurchaseBill }>(`/api/v1/purchase/bills/${id}/submit`)

export const recordBillPayment = (id: string, amount: number) =>
  apiClient.post(`/api/v1/purchase/bills/${id}/payment`, { amount })

export const getSupplierOutstanding = () =>
  apiClient.get('/api/v1/purchase/bills/outstanding')
