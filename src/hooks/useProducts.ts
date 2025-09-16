'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApiCall } from './useApiCall'
import type { Product } from '@/types'

export interface ProductFilters {
  search?: string
  category?: string
  inStockOnly?: boolean
  page?: number
  limit?: number
}

export interface ProductsResponse {
  success: boolean
  data: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export function useProducts(filters: ProductFilters = {}) {
  const { callApi } = useApiCall()

  const queryKey = ['products', filters]

  return useQuery({
    queryKey,
    queryFn: async (): Promise<ProductsResponse> => {
      const searchParams = new URLSearchParams()

      if (filters.search) searchParams.append('search', filters.search)
      if (filters.category) searchParams.append('category', filters.category)
      if (filters.inStockOnly) searchParams.append('inStockOnly', 'true')
      if (filters.page) searchParams.append('page', filters.page.toString())
      if (filters.limit) searchParams.append('limit', filters.limit.toString())

      const url = `/api/v1/products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      const result = await callApi<ProductsResponse>(url, {}, { showLoading: false })
      console.log('API Response in useProducts:', result)
      return result
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useProduct(id: string) {
  const { callApi } = useApiCall()

  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await callApi<{ success: boolean; data: Product }>(`/api/v1/products/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const { callApi } = useApiCall()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await callApi<{ success: boolean; data: Product }>(
        '/api/v1/products',
        {
          method: 'POST',
          body: JSON.stringify(productData),
        },
        {
          showSuccessNotification: true,
          successMessage: 'Product created successfully',
        }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const { callApi } = useApiCall()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...productData }: Partial<Product> & { id: string }) => {
      const response = await callApi<{ success: boolean; data: Product }>(
        `/api/v1/products/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(productData),
        },
        {
          showSuccessNotification: true,
          successMessage: 'Product updated successfully',
        }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] })
    },
  })
}
