export type InvoiceStatus = 'DRAFT' | 'SUBMITTED' | 'PAID' | 'CANCELLED' | 'PARTIAL'

export interface InvoiceLine {
  id: string
  itemId: string
  itemName: string
  itemCode: string
  batchId?: string
  batchNo?: string
  qty: number
  rate: number
  discount: number
  gstRate: number
  taxableAmount: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  gstAmount: number
  lineTotal: number
}

export interface Invoice {
  id: string
  invoiceNo: string
  customerId: string
  customerName: string
  invoiceDate: string
  dueDate?: string
  paymentTerms?: string
  lines: InvoiceLine[]
  subtotal: number
  totalDiscount: number
  totalTaxableAmount: number
  totalCgst: number
  totalSgst: number
  totalIgst: number
  totalGst: number
  roundOff: number
  grandTotal: number
  paidAmount: number
  outstandingAmount: number
  status: InvoiceStatus
  notes?: string
}

export interface Payment {
  id: string
  customerId: string
  customerName: string
  paymentDate: string
  amount: number
  mode: 'CASH' | 'BANK' | 'UPI' | 'CHEQUE' | 'NEFT' | 'RTGS'
  reference?: string
  bankAccount?: string
  allocations?: PaymentAllocation[]
  notes?: string
}

export interface PaymentAllocation {
  invoiceId: string
  invoiceNo: string
  amount: number
}

export type CreditNoteStatus = 'DRAFT' | 'SUBMITTED' | 'CANCELLED'

export interface CreditNoteLine {
  id: string
  itemId: string
  itemName: string
  itemCode: string
  batchId?: string
  batchNo?: string
  qty: number
  rate: number
  gstRate: number
  taxableAmount: number
  gstAmount: number
  lineTotal: number
}

export interface CreditNote {
  id: string
  creditNoteNo: string
  customerId: string
  customerName: string
  invoiceId?: string
  invoiceNo?: string
  creditNoteDate: string
  reason: string
  lines: CreditNoteLine[]
  subtotal: number
  totalGst: number
  grandTotal: number
  status: CreditNoteStatus
  notes?: string
}

export interface AgingRow {
  customerId: string
  customerName: string
  total: number
  current: number
  days1to30: number
  days31to60: number
  days61to90: number
  days90plus: number
}

export interface OutstandingRow {
  customerId: string
  customerName: string
  totalOutstanding: number
  invoiceCount: number
}
