import apiClient from '../client'
import type { PageResponse } from '../../types/common.types'
import type { Stock, StockAlert, CreateStockEntryRequest } from '../../types/inventory.types'

export interface StockQueryParams {
  page?: number
  size?: number
  itemId?: string
  warehouseId?: string
}

export async function getStock(params?: StockQueryParams): Promise<PageResponse<Stock>> {
  const { data } = await apiClient.get<PageResponse<Stock>>('/api/v1/inventory/stock', { params })
  return data
}

export async function getAlerts(): Promise<StockAlert[]> {
  const { data } = await apiClient.get<{ data: StockAlert[] }>('/api/v1/inventory/alerts')
  return data.data
}

export async function createStockEntry(entryData: CreateStockEntryRequest): Promise<void> {
  await apiClient.post('/api/v1/inventory/stock-entries', entryData)
}

export async function getWarehouses(): Promise<{ id: string; name: string }[]> {
  const { data } = await apiClient.get<{ data: { id: string; name: string }[] }>(
    '/api/v1/warehouses',
  )
  return data.data
}
