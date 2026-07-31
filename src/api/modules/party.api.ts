import apiClient from '../client'
import type { PageResponse } from '../../types/common.types'
import type { Party, CreatePartyRequest } from '../../types/party.types'

export interface PartyQueryParams {
  page?: number
  size?: number
  search?: string
  partyType?: string
}

export async function getParties(params?: PartyQueryParams): Promise<PageResponse<Party>> {
  const { data } = await apiClient.get<PageResponse<Party>>('/api/v1/parties', { params })
  return data
}

export async function getParty(id: string): Promise<Party> {
  const { data } = await apiClient.get<{ data: Party }>(`/api/v1/parties/${id}`)
  return data.data
}

export async function createParty(partyData: CreatePartyRequest): Promise<Party> {
  const { data } = await apiClient.post<{ data: Party }>('/api/v1/parties', partyData)
  return data.data
}

export async function updateParty(id: string, partyData: Partial<CreatePartyRequest>): Promise<Party> {
  const { data } = await apiClient.put<{ data: Party }>(`/api/v1/parties/${id}`, partyData)
  return data.data
}

export async function deleteParty(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/parties/${id}`)
}
