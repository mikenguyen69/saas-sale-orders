import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCustomers, useCustomer, useCustomerSearch, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/hooks/useCustomers'
import { useApiCall } from '@/hooks/useApiCall'
import type { Customer } from '@/types'

// Mock useApiCall
jest.mock('@/hooks/useApiCall')
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}))

const mockCustomer: Customer = {
  id: '1',
  name: 'Acme Corporation',
  contact_person: 'John Doe',
  email: 'john@acme.com',
  phone: '555-0100',
  shipping_address: '123 Main St, City, State 12345',
  billing_address: '123 Main St, City, State 12345',
  tenant_id: 'tenant1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockCustomersResponse = {
  success: true,
  data: [mockCustomer],
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  },
}

describe('useCustomers', () => {
  let queryClient: QueryClient
  const mockCallApi = jest.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()
    ;(useApiCall as jest.Mock).mockReturnValue({ callApi: mockCallApi })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  describe('useCustomers', () => {
    it('fetches customers successfully', async () => {
      mockCallApi.mockResolvedValue(mockCustomersResponse)

      const { result } = renderHook(() => useCustomers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockCustomersResponse)
      expect(mockCallApi).toHaveBeenCalledWith('/api/v1/customers', {}, { showLoading: false })
    })

    it('applies search filter', async () => {
      mockCallApi.mockResolvedValue(mockCustomersResponse)

      const { result } = renderHook(() => useCustomers({ search: 'Acme' }), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockCallApi).toHaveBeenCalledWith(
        '/api/v1/customers?search=Acme',
        {},
        { showLoading: false }
      )
    })

    it('applies pagination filters', async () => {
      mockCallApi.mockResolvedValue(mockCustomersResponse)

      const { result } = renderHook(() => useCustomers({ page: 2, limit: 20 }), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockCallApi).toHaveBeenCalledWith(
        '/api/v1/customers?page=2&limit=20',
        {},
        { showLoading: false }
      )
    })

    it('can be disabled', async () => {
      mockCallApi.mockResolvedValue(mockCustomersResponse)

      const { result } = renderHook(() => useCustomers({}, false), { wrapper })

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false)
      })

      expect(mockCallApi).not.toHaveBeenCalled()
    })

    it('handles errors', async () => {
      const error = new Error('Failed to fetch customers')
      mockCallApi.mockRejectedValue(error)

      const { result } = renderHook(() => useCustomers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })

    it('caches results for 5 minutes', async () => {
      mockCallApi.mockResolvedValue(mockCustomersResponse)

      const { result, rerender } = renderHook(() => useCustomers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const firstCallCount = mockCallApi.mock.calls.length

      rerender()

      // Should not call API again due to staleTime
      expect(mockCallApi.mock.calls.length).toBe(firstCallCount)
    })
  })

  describe('useCustomer', () => {
    it('fetches single customer successfully', async () => {
      mockCallApi.mockResolvedValue({ success: true, data: mockCustomer })

      const { result } = renderHook(() => useCustomer('1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockCustomer)
      expect(mockCallApi).toHaveBeenCalledWith('/api/v1/customers/1')
    })

    it('is disabled when id is not provided', async () => {
      mockCallApi.mockResolvedValue({ success: true, data: mockCustomer })

      const { result } = renderHook(() => useCustomer(''), { wrapper })

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false)
      })

      expect(mockCallApi).not.toHaveBeenCalled()
    })

    it('handles errors', async () => {
      const error = new Error('Customer not found')
      mockCallApi.mockRejectedValue(error)

      const { result } = renderHook(() => useCustomer('1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })
  })

  describe('useCustomerSearch', () => {
    it('searches customers with debounced term', async () => {
      mockCallApi.mockResolvedValue(mockCustomersResponse)

      const { result } = renderHook(() => useCustomerSearch('Acme'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockCallApi).toHaveBeenCalledWith(
        '/api/v1/customers?search=Acme&limit=10',
        {},
        { showLoading: false }
      )
    })

    it('is disabled when search term is empty', async () => {
      mockCallApi.mockResolvedValue(mockCustomersResponse)

      const { result } = renderHook(() => useCustomerSearch(''), { wrapper })

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false)
      })

      expect(mockCallApi).not.toHaveBeenCalled()
    })

    it('can be disabled with enabled flag', async () => {
      mockCallApi.mockResolvedValue(mockCustomersResponse)

      const { result } = renderHook(() => useCustomerSearch('Acme', false), { wrapper })

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false)
      })

      expect(mockCallApi).not.toHaveBeenCalled()
    })

    it('limits results to 10', async () => {
      mockCallApi.mockResolvedValue(mockCustomersResponse)

      const { result } = renderHook(() => useCustomerSearch('test'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockCallApi).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        {},
        { showLoading: false }
      )
    })
  })

  describe('useCreateCustomer', () => {
    it('creates customer successfully', async () => {
      mockCallApi.mockResolvedValue({ success: true, data: mockCustomer })

      const { result } = renderHook(() => useCreateCustomer(), { wrapper })

      result.current.mutate({
        name: 'Acme Corporation',
        contact_person: 'John Doe',
        email: 'john@acme.com',
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockCustomer)
      expect(mockCallApi).toHaveBeenCalledWith(
        '/api/v1/customers',
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Acme Corporation',
            contact_person: 'John Doe',
            email: 'john@acme.com',
          }),
        },
        {
          showSuccessNotification: true,
          successMessage: 'Customer created successfully',
        }
      )
    })

    it('invalidates customers query on success', async () => {
      mockCallApi.mockResolvedValue({ success: true, data: mockCustomer })
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCreateCustomer(), { wrapper })

      result.current.mutate({
        name: 'Acme Corporation',
        contact_person: 'John Doe',
        email: 'john@acme.com',
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['customers'] })
    })

    it('handles create errors', async () => {
      const error = new Error('Failed to create customer')
      mockCallApi.mockRejectedValue(error)

      const { result } = renderHook(() => useCreateCustomer(), { wrapper })

      result.current.mutate({
        name: 'Acme Corporation',
        contact_person: 'John Doe',
        email: 'john@acme.com',
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })
  })

  describe('useUpdateCustomer', () => {
    it('updates customer successfully', async () => {
      const updatedCustomer = { ...mockCustomer, name: 'Updated Corporation' }
      mockCallApi.mockResolvedValue({ success: true, data: updatedCustomer })

      const { result } = renderHook(() => useUpdateCustomer(), { wrapper })

      result.current.mutate({
        id: '1',
        name: 'Updated Corporation',
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(updatedCustomer)
      expect(mockCallApi).toHaveBeenCalledWith(
        '/api/v1/customers/1',
        {
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated Corporation' }),
        },
        {
          showSuccessNotification: true,
          successMessage: 'Customer updated successfully',
        }
      )
    })

    it('invalidates related queries on success', async () => {
      mockCallApi.mockResolvedValue({ success: true, data: mockCustomer })
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useUpdateCustomer(), { wrapper })

      result.current.mutate({
        id: '1',
        name: 'Updated Corporation',
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['customers'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['customer', '1'] })
    })

    it('handles update errors', async () => {
      const error = new Error('Failed to update customer')
      mockCallApi.mockRejectedValue(error)

      const { result } = renderHook(() => useUpdateCustomer(), { wrapper })

      result.current.mutate({
        id: '1',
        name: 'Updated Corporation',
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })
  })

  describe('useDeleteCustomer', () => {
    it('deletes customer successfully', async () => {
      mockCallApi.mockResolvedValue({ success: true, message: 'Customer deleted' })

      const { result } = renderHook(() => useDeleteCustomer(), { wrapper })

      result.current.mutate('1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockCallApi).toHaveBeenCalledWith(
        '/api/v1/customers/1',
        {
          method: 'DELETE',
        },
        {
          showSuccessNotification: true,
          successMessage: 'Customer deleted successfully',
        }
      )
    })

    it('invalidates customers query on success', async () => {
      mockCallApi.mockResolvedValue({ success: true, message: 'Customer deleted' })
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useDeleteCustomer(), { wrapper })

      result.current.mutate('1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['customers'] })
    })

    it('handles delete errors', async () => {
      const error = new Error('Failed to delete customer')
      mockCallApi.mockRejectedValue(error)

      const { result } = renderHook(() => useDeleteCustomer(), { wrapper })

      result.current.mutate('1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })
  })
})