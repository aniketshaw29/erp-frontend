export type PartyType = 'VENDOR' | 'CUSTOMER' | 'BOTH'

export interface Party {
  id: string
  name: string
  partyType: PartyType
  gstin?: string
  phone?: string
  email?: string
  creditLimit: number
  outstandingAmount: number
  linkedTenantId?: string
  isActive: boolean
}
