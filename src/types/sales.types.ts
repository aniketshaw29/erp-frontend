export type InvoiceStatus = 'DRAFT' | 'SUBMITTED' | 'PAID' | 'CANCELLED' | 'PARTIAL'

export interface InvoiceLine {
  id: string
  itemId: string
  itemName: string
  itemCode: string
  qty: number
  rate: number
  discount: number
  gstRate: number
  taxableAmount: number
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
  lines: InvoiceLine[]
  subtotal: number
  totalDiscount: number
  totalTaxableAmount: number
  totalGst: number
  grandTotal: number
  paidAmount: number
  outstandingAmount: number
  status: InvoiceStatus
  notes?: string
}

export interface Payment {
  id: string
  invoiceId: string
  paymentDate: string
  amount: number
  mode: 'CASH' | 'BANK' | 'UPI' | 'CHEQUE'
  reference?: string
  notes?: string
}
