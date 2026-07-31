export type AlertType = 'LOW_STOCK' | 'EXPIRY'
export type StockStatus = 'OK' | 'LOW' | 'CRITICAL'

export interface StockEntry {
  id: string
  itemId: string
  itemName: string
  itemCode: string
  warehouseId: string
  warehouseName: string
  batchNo?: string
  expiryDate?: string
  qtyOnHand: number
  reorderLevel: number
  status: StockStatus
}

export interface StockAlert {
  id: string
  itemId: string
  itemName: string
  itemCode: string
  warehouseName: string
  alertType: AlertType
  qtyOnHand?: number
  reorderLevel?: number
  expiryDate?: string
  daysUntilExpiry?: number
}
