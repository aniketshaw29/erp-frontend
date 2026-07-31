export type PurchaseOrderStatus = 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'CANCELLED'

export interface PurchaseOrderLine {
  id: string
  itemId: string
  itemName: string
  itemCode: string
  qty: number
  rate: number
  gstRate: number
  taxableAmount: number
  gstAmount: number
  lineTotal: number
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplierName: string
  orderDate: string
  expectedDeliveryDate?: string
  lines: PurchaseOrderLine[]
  subtotal: number
  totalGst: number
  grandTotal: number
  status: PurchaseOrderStatus
  notes?: string
}
