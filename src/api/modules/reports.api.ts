import client from '../client'

// Sales reports
export const getDailySales = (date: string) => client.get('/api/v1/reports/sales/daily', { params: { date } })
export const getMonthlySales = (month: number, year: number) => client.get('/api/v1/reports/sales/monthly', { params: { month, year } })
export const getProductWiseSales = (from: string, to: string) => client.get('/api/v1/reports/sales/product-wise', { params: { from, to } })
export const getCustomerWiseSales = (from: string, to: string) => client.get('/api/v1/reports/sales/customer-wise', { params: { from, to } })
export const getSalesTrend = (months?: number) => client.get('/api/v1/reports/sales/trend', { params: { months } })

// Purchase reports
export const getSupplierWisePurchases = (from: string, to: string) => client.get('/api/v1/reports/purchase/supplier-wise', { params: { from, to } })
export const getItemWisePurchases = (from: string, to: string) => client.get('/api/v1/reports/purchase/item-wise', { params: { from, to } })

// Inventory reports
export const getStockOnHandReport = (warehouseId?: string) => client.get('/api/v1/reports/inventory/stock-on-hand', { params: { warehouseId } })
export const getExpiryReport = (withinDays?: number) => client.get('/api/v1/reports/inventory/expiry', { params: { withinDays } })
export const getSlowMovingItems = (days?: number) => client.get('/api/v1/reports/inventory/slow-moving', { params: { days } })
export const getStockValuation = () => client.get('/api/v1/reports/inventory/valuation')

// Dashboard
export const getDashboardKpi = () => client.get('/api/v1/dashboard')

// Excel exports
export const downloadStockOnHandExcel = (warehouseId?: string) => client.get('/api/v1/reports/inventory/stock-on-hand/excel', { params: { warehouseId }, responseType: 'blob' })
export const downloadProductSalesExcel = (from: string, to: string) => client.get('/api/v1/reports/sales/product-wise/excel', { params: { from, to }, responseType: 'blob' })
