export type ItemType = 'STOCK' | 'CONSUMABLE' | 'SERVICE'
export type TrackingType = 'NONE' | 'BATCH' | 'SERIAL'

export interface Item {
  id: string
  code: string
  name: string
  itemType: ItemType
  trackingType: TrackingType
  gstRate: number
  standardRate: number
  purchaseRate: number
  mrp: number
  isActive: boolean
}
