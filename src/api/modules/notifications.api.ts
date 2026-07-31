import client from '../client'

export const getNotifications = (unreadOnly?: boolean) =>
  client.get('/api/v1/notifications', { params: { unreadOnly } })

export const getUnreadCount = () =>
  client.get('/api/v1/notifications/count')

export const markAsRead = (id: string) =>
  client.post(`/api/v1/notifications/${id}/read`)

export const markAllAsRead = () =>
  client.post('/api/v1/notifications/read-all')
