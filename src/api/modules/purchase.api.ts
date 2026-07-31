import apiClient from '../client'
import type { PageResponse } from '../../types/common.types'
import type { PurchaseOrder } from '../../types/purchase.types'

export interface PurchaseOrderQueryParams {
  page?: number
  size?: number
  status?: string
  supplierId?: string
}

export async function getPurchaseOrders(params?: PurchaseOrderQueryParams): Promise<PageResponse<PurchaseOrder>> {
  const { data } = await apiClient.get<PageResponse<PurchaseOrder>>('/purchase/orders', { params })
  return data
}

export async function createPurchaseOrder(orderData: Omit<PurchaseOrder, 'id' | 'poNumber'>): Promise<PurchaseOrder> {
  const { data } = await apiClient.post<{ data: PurchaseOrder }>('/purchase/orders', orderData)
  return data.data
}
