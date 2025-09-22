'use client'

import { useQuery } from '@tanstack/react-query'
import { useApiCall } from './useApiCall'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { SaleOrder, Product } from '../types'

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
  const { user, loading } = useAuthContext()

  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await callApi<{ success: boolean; data: DashboardStats }>(
        '/api/v1/dashboard/stats'
      )
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !loading && !!user, // Only run when auth is ready and user is authenticated
  })
}

export function useRecentOrders() {
  const { callApi } = useApiCall()
  const { user, loading } = useAuthContext()

  return useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const response = await callApi<SaleOrder[]>(
        '/api/v1/orders?limit=5&sort=created_at&order=desc'
      )
      return response || []
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !loading && !!user, // Only run when auth is ready and user is authenticated
  })
}

export function useLowStockProducts() {
  const { callApi } = useApiCall()
  const { user, loading } = useAuthContext()

  return useQuery({
    queryKey: ['low-stock-products'],
    queryFn: async () => {
      const response = await callApi<Product[]>('/api/v1/products?lowStock=true&limit=5')
      return response || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !loading && !!user, // Only run when auth is ready and user is authenticated
  })
}
