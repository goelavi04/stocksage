import { useQuery } from '@tanstack/react-query'
import { alertAPI } from '../services/api'

export const useNotifications = (unreadOnly = false) =>
  useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: () => alertAPI.getNotifications(unreadOnly).then((r) => r.data),
  })

export const useUnreadCount = () =>
  useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () =>
      alertAPI.getNotifications(true).then((r) => {
        const data = r.data
        return Array.isArray(data) ? data.length : (data?.count ?? 0)
      }),
    refetchInterval: 60 * 1000,
  })
