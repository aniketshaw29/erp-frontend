export type AlertType = 'LOW_STOCK' | 'EXPIRY'
export type StockStatus = 'OK' | 'LOW' | 'CRITICAL'
export type StockEntryType = 'OPENING' | 'ADJUSTMENT' | 'TRANSFER'

export interface Stock {
  id: string
  itemId: string
  itemName: string
  itemCode: string
  warehouseId: string
  warehouseName: string
  batchNo?: string
  mfgDate?: string
  expiryDate?: string
  mrp?: number
  qtyOnHand: number
  reorderLevel: number
  status: StockStatus
}

// Keep StockEntry as alias for backward compat
export type StockEntry = Stock

export interface Batch {
  id: string
  batchNo: string
  itemId: string
  mfgDate?: string
  expiryDate?: string
  mrp?: number
}

export interface StockEntryLine {
  itemId: string
  itemName?: string
  batchNo?: string
  mfgDate?: string
  expiryDate?: string
  mrp?: number
  qty: number
  rate: number
}

export interface CreateStockEntryRequest {
  entryType: StockEntryType
  warehouseId: string
  toWarehouseId?: string
  lines: StockEntryLine[]
  remarks?: string
}

export interface StockAlert {
  id: string
  itemId: string
  itemName: string
  itemCode: string
  warehouseId?: string
  warehouseName: string
  alertType: AlertType
  qtyOnHand?: number
  reorderLevel?: number
  batchNo?: string
  expiryDate?: string
  daysUntilExpiry?: number
}
