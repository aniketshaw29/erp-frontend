import apiClient from '../client'
import type { PageResponse } from '../../types/common.types'
import type { Party } from '../../types/party.types'

export interface PartyQueryParams {
  page?: number
  size?: number
  search?: string
  partyType?: string
}

export async function getParties(params?: PartyQueryParams): Promise<PageResponse<Party>> {
  const { data } = await apiClient.get<PageResponse<Party>>('/parties', { params })
  return data
}

export async function getParty(id: string): Promise<Party> {
  const { data } = await apiClient.get<{ data: Party }>(`/parties/${id}`)
  return data.data
}

export async function createParty(partyData: Omit<Party, 'id'>): Promise<Party> {
  const { data } = await apiClient.post<{ data: Party }>('/parties', partyData)
  return data.data
}

export async function updateParty(id: string, partyData: Partial<Party>): Promise<Party> {
  const { data } = await apiClient.put<{ data: Party }>(`/parties/${id}`, partyData)
  return data.data
}
