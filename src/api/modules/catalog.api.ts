import apiClient from '../client'
import type { PageResponse } from '../../types/common.types'
import type { Item } from '../../types/catalog.types'

export interface ItemQueryParams {
  page?: number
  size?: number
  search?: string
  itemType?: string
}

export async function getItems(params?: ItemQueryParams): Promise<PageResponse<Item>> {
  const { data } = await apiClient.get<PageResponse<Item>>('/catalog/items', { params })
  return data
}

export async function getItem(id: string): Promise<Item> {
  const { data } = await apiClient.get<{ data: Item }>(`/catalog/items/${id}`)
  return data.data
}

export async function createItem(itemData: Omit<Item, 'id'>): Promise<Item> {
  const { data } = await apiClient.post<{ data: Item }>('/catalog/items', itemData)
  return data.data
}

export async function updateItem(id: string, itemData: Partial<Item>): Promise<Item> {
  const { data } = await apiClient.put<{ data: Item }>(`/catalog/items/${id}`, itemData)
  return data.data
}
