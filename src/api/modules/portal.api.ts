import client from '../client'

export const getPortalCatalog = (params?: any) =>
  client.get('/api/v1/portal/catalog', { params })

export const getPortalItem = (id: string) =>
  client.get(`/api/v1/portal/catalog/${id}`)

export const placeOrder = (data: any) =>
  client.post('/api/v1/portal/orders', data)

export const getMyOrders = (params?: any) =>
  client.get('/api/v1/portal/orders', { params })

export const getMyOrder = (id: string) =>
  client.get(`/api/v1/portal/orders/${id}`)

export const getMyInvoices = (params?: any) =>
  client.get('/api/v1/portal/invoices', { params })

export const getMyOutstanding = () =>
  client.get('/api/v1/portal/outstanding')

export const getPortalDashboard = () =>
  client.get('/api/v1/portal/dashboard')
