export type PartyType = 'VENDOR' | 'CUSTOMER' | 'BOTH'

export type PaymentTerms = 'NET30' | 'NET60' | 'NET90' | 'COD' | 'ADVANCE'

export interface PartyAddress {
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  country?: string
}

export interface Party {
  id: string
  name: string
  partyType: PartyType
  gstin?: string
  pan?: string
  phone?: string
  email?: string
  creditLimit: number
  creditDays?: number
  paymentTerms?: PaymentTerms
  outstandingAmount: number
  address?: PartyAddress
  linkedTenantId?: string
  isActive: boolean
}

export interface CreatePartyRequest {
  name: string
  partyType: PartyType
  gstin?: string
  pan?: string
  phone?: string
  email?: string
  creditLimit?: number
  creditDays?: number
  paymentTerms?: PaymentTerms
  address?: PartyAddress
}
