export type ItemType = 'STOCK' | 'CONSUMABLE' | 'SERVICE'
export type TrackingType = 'NONE' | 'BATCH' | 'SERIAL'

export interface ItemCategory {
  id: string
  name: string
  parentId?: string
}

export interface Uom {
  id: string
  name: string
  symbol: string
}

export interface HsnCode {
  id: string
  code: string
  description: string
  gstRate: number
}

export interface Item {
  id: string
  code: string
  name: string
  itemType: ItemType
  trackingType: TrackingType
  categoryId?: string
  categoryName?: string
  uomId?: string
  uomName?: string
  hsnCodeId?: string
  hsnCode?: string
  gstRate: number
  standardRate: number
  purchaseRate: number
  mrp: number
  reorderLevel?: number
  reorderQty?: number
  hasExpiry?: boolean
  isActive: boolean
}

export interface CreateItemRequest {
  name: string
  code?: string
  itemType: ItemType
  trackingType: TrackingType
  categoryId?: string
  uomId?: string
  hsnCodeId?: string
  standardRate?: number
  purchaseRate?: number
  mrp?: number
  reorderLevel?: number
  reorderQty?: number
  hasExpiry?: boolean
}
