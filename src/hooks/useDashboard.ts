'use client'

import { useQuery } from '@tanstack/react-query'
import { useApiCall } from './useApiCall'

export interface DashboardStats {
  totalOrders: number
  totalProducts: number
  totalUsers: number
  totalRevenue: number
  pendingOrders: number
  lowStockProducts: number
  recentOrdersCount: number
  ordersByStatus: {
    draft: number
    submitted: number
    approved: number
    fulfilled: number
    rejected: number
  }
}

export function useDashboardStats() {
  const { callApi } = useApiCall()

  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await callApi<{ success: boolean; data: DashboardStats }>(
        '/api/v1/dashboard/stats'
      )
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useRecentOrders() {
  const { callApi } = useApiCall()

  return useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const response = await callApi<any>('/api/v1/orders?limit=5&sort=created_at&order=desc')
      return response.data || []
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export function useLowStockProducts() {
  const { callApi } = useApiCall()

  return useQuery({
    queryKey: ['low-stock-products'],
    queryFn: async () => {
      const response = await callApi<any>('/api/v1/products?lowStock=true&limit=5')
      return response.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
