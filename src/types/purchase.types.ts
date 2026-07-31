export type PurchaseOrderStatus = 'DRAFT' | 'SUBMITTED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'

export interface PurchaseOrderLine {
  id: string
  itemId: string
  itemName: string
  itemCode: string
  qty: number
  receivedQty?: number
  rate: number
  discount?: number
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
  totalDiscount?: number
  totalTaxableAmount?: number
  totalGst: number
  grandTotal: number
  status: PurchaseOrderStatus
  notes?: string
}

export type GrnStatus = 'DRAFT' | 'SUBMITTED' | 'CANCELLED'

export interface GrnLine {
  id: string
  itemId: string
  itemName: string
  itemCode: string
  poLineId?: string
  batchNo?: string
  mfgDate?: string
  expiryDate?: string
  mrp?: number
  qty: number
  rate: number
  discount?: number
  gstRate: number
  taxableAmount: number
  gstAmount: number
  lineTotal: number
}

export interface Grn {
  id: string
  grnNumber: string
  poId?: string
  poNumber?: string
  supplierId: string
  supplierName: string
  warehouseId: string
  warehouseName: string
  receiptDate: string
  supplierDocNo?: string
  lines: GrnLine[]
  subtotal: number
  totalGst: number
  grandTotal: number
  status: GrnStatus
  notes?: string
}

export type BillStatus = 'DRAFT' | 'SUBMITTED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export interface BillLine {
  id: string
  itemId?: string
  itemName?: string
  grnLineId?: string
  description?: string
  qty: number
  rate: number
  discount?: number
  gstRate: number
  taxableAmount: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  lineTotal: number
}

export interface PurchaseBill {
  id: string
  billNumber: string
  supplierId: string
  supplierName: string
  supplierInvoiceNo?: string
  supplierInvoiceDate?: string
  billDate: string
  dueDate?: string
  lines: BillLine[]
  subtotal: number
  totalGst: number
  grandTotal: number
  paidAmount: number
  outstandingAmount: number
  status: BillStatus
  notes?: string
}
