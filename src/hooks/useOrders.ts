'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApiCall } from './useApiCall'
import type { SaleOrder, OrderItem } from '@/types'

export interface OrderFilters {
  status?: string
  salesperson_id?: string
  search?: string
  page?: number
  limit?: number
}

export interface OrdersResponse {
  success: boolean
  data: SaleOrder[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export interface CreateOrderData {
  customer_name: string
  contact_person: string
  email: string
  shipping_address?: string
  delivery_date?: string
  notes: string
  items: Omit<OrderItem, 'id' | 'order_id' | 'line_total' | 'is_in_stock' | 'line_status'>[]
}

export function useOrders(filters: OrderFilters = {}) {
  const { callApi } = useApiCall()

  const queryKey = ['orders', filters]

  return useQuery({
    queryKey,
    queryFn: async (): Promise<OrdersResponse> => {
      const searchParams = new URLSearchParams()

      if (filters.status) searchParams.append('status', filters.status)
      if (filters.salesperson_id) searchParams.append('salesperson_id', filters.salesperson_id)
      if (filters.search) searchParams.append('search', filters.search)
      if (filters.page) searchParams.append('page', filters.page.toString())
      if (filters.limit) searchParams.append('limit', filters.limit.toString())

      const url = `/api/v1/orders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      return callApi<OrdersResponse>(url, {}, { showLoading: false })
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useOrder(id: string) {
  const { callApi } = useApiCall()

  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await callApi<{ success: boolean; data: SaleOrder }>(`/api/v1/orders/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const { callApi } = useApiCall()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      const response = await callApi<{ success: boolean; data: SaleOrder }>(
        '/api/v1/orders',
        {
          method: 'POST',
          body: JSON.stringify(orderData),
        },
        {
          showSuccessNotification: true,
          successMessage: 'Order created successfully',
        }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useUpdateOrder() {
  const { callApi } = useApiCall()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...orderData }: Partial<CreateOrderData> & { id: string }) => {
      const response = await callApi<{ success: boolean; data: SaleOrder }>(
        `/api/v1/orders/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(orderData),
        },
        {
          showSuccessNotification: true,
          successMessage: 'Order updated successfully',
        }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
    },
  })
}

export function useSubmitOrder() {
  const { callApi } = useApiCall()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await callApi<{ success: boolean; data: SaleOrder }>(
        `/api/v1/orders/${id}/submit`,
        {
          method: 'POST',
        },
        {
          showSuccessNotification: true,
          successMessage: 'Order submitted successfully',
        }
      )
      return response.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', id] })
    },
  })
}

export function useApproveOrder() {
  const { callApi } = useApiCall()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await callApi<{ success: boolean; data: SaleOrder }>(
        `/api/v1/orders/${id}/approve`,
        {
          method: 'POST',
        },
        {
          showSuccessNotification: true,
          successMessage: 'Order approved successfully',
        }
      )
      return response.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', id] })
    },
  })
}

export function useRejectOrder() {
  const { callApi } = useApiCall()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await callApi<{ success: boolean; data: SaleOrder }>(
        `/api/v1/orders/${id}/reject`,
        {
          method: 'POST',
        },
        {
          showSuccessNotification: true,
          successMessage: 'Order rejected successfully',
        }
      )
      return response.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', id] })
    },
  })
}

export function useFulfillOrder() {
  const { callApi } = useApiCall()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await callApi<{ success: boolean; data: SaleOrder }>(
        `/api/v1/orders/${id}/fulfill`,
        {
          method: 'POST',
        },
        {
          showSuccessNotification: true,
          successMessage: 'Order fulfilled successfully',
        }
      )
      return response.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', id] })
    },
  })
}
