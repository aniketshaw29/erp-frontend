import apiClient from '../client'
import type { PageResponse } from '../../types/common.types'
import type { StockEntry, StockAlert } from '../../types/inventory.types'

export interface StockQueryParams {
  page?: number
  size?: number
  itemId?: string
  warehouseId?: string
}

export async function getStock(params?: StockQueryParams): Promise<PageResponse<StockEntry>> {
  const { data } = await apiClient.get<PageResponse<StockEntry>>('/inventory/stock', { params })
  return data
}

export async function getAlerts(): Promise<StockAlert[]> {
  const { data } = await apiClient.get<{ data: StockAlert[] }>('/inventory/alerts')
  return data.data
}

export async function createStockEntry(entryData: Omit<StockEntry, 'id'>): Promise<void> {
  await apiClient.post('/inventory/stock', entryData)
}
