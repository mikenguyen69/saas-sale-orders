'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApiCall } from './useApiCall'
import { useDebounce } from './useDebounce'
import type { Customer, CustomerCreateData, CustomerUpdateData } from '@/types'

export interface CustomerFilters {
  search?: string
  page?: number
  limit?: number
}

export interface CustomersResponse {
  success: boolean
  data: Customer[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export function useCustomers(filters: CustomerFilters = {}, enabled = true) {
  const { callApi } = useApiCall()

  const queryKey = ['customers', filters]

  return useQuery({
    queryKey,
    queryFn: async (): Promise<CustomersResponse> => {
      const searchParams = new URLSearchParams()

      if (filters.search) searchParams.append('search', filters.search)
      if (filters.page) searchParams.append('page', filters.page.toString())
      if (filters.limit) searchParams.append('limit', filters.limit.toString())

      const url = `/api/v1/customers${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      return callApi<CustomersResponse>(url, {}, { showLoading: false })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  })
}

export function useCustomer(id: string) {
  const { callApi } = useApiCall()

  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const response = await callApi<{ success: boolean; data: Customer }>(
        `/api/v1/customers/${id}`
      )
      return response.data
    },
    enabled: !!id,
  })
}

export function useCustomerSearch(searchTerm: string, enabled = true) {
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  return useCustomers(
    {
      search: debouncedSearchTerm || undefined,
      limit: 10,
    },
    enabled && !!debouncedSearchTerm
  )
}

export function useCheckEmailAvailability() {
  const { callApi } = useApiCall()

  return useMutation({
    mutationFn: async ({
      email,
      excludeCustomerId,
    }: {
      email: string
      excludeCustomerId?: string
    }) => {
      const searchParams = new URLSearchParams()
      searchParams.append('search', email)
      searchParams.append('limit', '1')

      const response = await callApi<{ success: boolean; data: Customer[] }>(
        `/api/v1/customers?${searchParams.toString()}`,
        {},
        { showLoading: false, showErrorNotification: false }
      )

      const customers = response.data || []

      if (customers.length === 0) {
        return true // Email is available
      }

      const existingCustomer = customers[0]
      const emailMatches = existingCustomer.email.toLowerCase() === email.toLowerCase()

      // If we're excluding a specific customer (edit mode), check if it's the same customer
      if (emailMatches && excludeCustomerId && existingCustomer.id === excludeCustomerId) {
        return true // Same customer, email is available for them
      }

      return !emailMatches // Email is available if it doesn't match
    },
  })
}

export function useCreateCustomer() {
  const { callApi } = useApiCall()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (customerData: CustomerCreateData) => {
      const response = await callApi<{ success: boolean; data: Customer }>(
        '/api/v1/customers',
        {
          method: 'POST',
          body: JSON.stringify(customerData),
        },
        {
          showSuccessNotification: true,
          successMessage: 'Customer created successfully',
        }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpdateCustomer() {
  const { callApi } = useApiCall()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...customerData }: Partial<CustomerUpdateData> & { id: string }) => {
      const response = await callApi<{ success: boolean; data: Customer }>(
        `/api/v1/customers/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(customerData),
        },
        {
          showSuccessNotification: true,
          successMessage: 'Customer updated successfully',
        }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] })
    },
  })
}

export function useDeleteCustomer() {
  const { callApi } = useApiCall()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await callApi<{ success: boolean; message: string }>(
        `/api/v1/customers/${id}`,
        {
          method: 'DELETE',
        },
        {
          showSuccessNotification: true,
          successMessage: 'Customer deleted successfully',
        }
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}
