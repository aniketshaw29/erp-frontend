import apiClient from '../client'
import type { PageResponse } from '../../types/common.types'
import type { Item, CreateItemRequest, ItemCategory, Uom, HsnCode } from '../../types/catalog.types'

export interface ItemQueryParams {
  page?: number
  size?: number
  search?: string
  itemType?: string
}

export async function getItems(params?: ItemQueryParams): Promise<PageResponse<Item>> {
  const { data } = await apiClient.get<PageResponse<Item>>('/api/v1/catalog/items', { params })
  return data
}

export async function getItem(id: string): Promise<Item> {
  const { data } = await apiClient.get<{ data: Item }>(`/api/v1/catalog/items/${id}`)
  return data.data
}

export async function createItem(itemData: CreateItemRequest): Promise<Item> {
  const { data } = await apiClient.post<{ data: Item }>('/api/v1/catalog/items', itemData)
  return data.data
}

export async function updateItem(id: string, itemData: Partial<CreateItemRequest>): Promise<Item> {
  const { data } = await apiClient.put<{ data: Item }>(`/api/v1/catalog/items/${id}`, itemData)
  return data.data
}

export async function deleteItem(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/catalog/items/${id}`)
}

export async function getItemCategories(): Promise<ItemCategory[]> {
  const { data } = await apiClient.get<{ data: ItemCategory[] }>('/api/v1/item-categories')
  return data.data
}

export async function getUoms(): Promise<Uom[]> {
  const { data } = await apiClient.get<{ data: Uom[] }>('/api/v1/uoms')
  return data.data
}

export async function getHsnCodes(search?: string): Promise<HsnCode[]> {
  const { data } = await apiClient.get<{ data: HsnCode[] }>('/api/v1/hsn-codes', {
    params: search ? { search } : undefined,
  })
  return data.data
}
