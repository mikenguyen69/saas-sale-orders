import { CustomerApi } from '../customerApi'
import { apiRequest } from '../../utils/api'

// Mock the apiRequest utility
jest.mock('../../utils/api')

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

describe('CustomerApi', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('create', () => {
    it('should create a customer successfully', async () => {
      const customerData = {
        name: 'Test Customer',
        contact_person: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
      }

      const expectedCustomer = {
        id: '1',
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockApiRequest.mockResolvedValueOnce(expectedCustomer)

      const result = await CustomerApi.create(customerData)

      expect(mockApiRequest).toHaveBeenCalledWith({
        url: '/api/v1/customers',
        method: 'POST',
        data: customerData,
      })
      expect(result).toEqual(expectedCustomer)
    })
  })

  describe('update', () => {
    it('should update a customer successfully', async () => {
      const customerId = '1'
      const customerData = {
        name: 'Updated Customer',
        contact_person: 'Jane Doe',
        email: 'jane@example.com',
      }

      const expectedCustomer = {
        id: customerId,
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockApiRequest.mockResolvedValueOnce(expectedCustomer)

      const result = await CustomerApi.update(customerId, customerData)

      expect(mockApiRequest).toHaveBeenCalledWith({
        url: `/api/v1/customers/${customerId}`,
        method: 'PUT',
        data: customerData,
      })
      expect(result).toEqual(expectedCustomer)
    })
  })

  describe('search', () => {
    it('should search customers with all parameters', async () => {
      const searchParams = {
        search: 'test',
        limit: 10,
        offset: 0,
        signal: new AbortController().signal,
      }

      const expectedCustomers = [
        { id: '1', name: 'Test Customer 1', email: 'test1@example.com' },
        { id: '2', name: 'Test Customer 2', email: 'test2@example.com' },
      ]

      mockApiRequest.mockResolvedValueOnce(expectedCustomers)

      const result = await CustomerApi.search(searchParams)

      expect(mockApiRequest).toHaveBeenCalledWith({
        url: '/api/v1/customers?search=test&limit=10&offset=0',
        method: 'GET',
        signal: searchParams.signal,
      })
      expect(result).toEqual(expectedCustomers)
    })

    it('should search customers with minimal parameters', async () => {
      const expectedCustomers = [{ id: '1', name: 'Customer 1', email: 'customer1@example.com' }]

      mockApiRequest.mockResolvedValueOnce(expectedCustomers)

      const result = await CustomerApi.search()

      expect(mockApiRequest).toHaveBeenCalledWith({
        url: '/api/v1/customers',
        method: 'GET',
        signal: undefined,
      })
      expect(result).toEqual(expectedCustomers)
    })
  })

  describe('checkEmailAvailability', () => {
    it('should return true when email is available', async () => {
      mockApiRequest.mockResolvedValueOnce([]) // No customers found

      const result = await CustomerApi.checkEmailAvailability({
        email: 'available@example.com',
      })

      expect(result).toBe(true)
      expect(mockApiRequest).toHaveBeenCalledWith({
        url: '/api/v1/customers?search=available%40example.com&limit=1',
        method: 'GET',
        signal: undefined,
      })
    })

    it('should return false when email is taken', async () => {
      const existingCustomer = {
        id: '1',
        email: 'taken@example.com',
        name: 'Existing Customer',
      }

      mockApiRequest.mockResolvedValueOnce([existingCustomer])

      const result = await CustomerApi.checkEmailAvailability({
        email: 'taken@example.com',
      })

      expect(result).toBe(false)
    })

    it('should return true when email belongs to excluded customer (edit mode)', async () => {
      const existingCustomer = {
        id: '1',
        email: 'test@example.com',
        name: 'Test Customer',
      }

      mockApiRequest.mockResolvedValueOnce([existingCustomer])

      const result = await CustomerApi.checkEmailAvailability({
        email: 'test@example.com',
        excludeCustomerId: '1',
      })

      expect(result).toBe(true) // Same customer, so email is available for them
    })

    it('should handle case-insensitive email comparison', async () => {
      const existingCustomer = {
        id: '1',
        email: 'Test@Example.com',
        name: 'Test Customer',
      }

      mockApiRequest.mockResolvedValueOnce([existingCustomer])

      const result = await CustomerApi.checkEmailAvailability({
        email: 'test@example.com',
      })

      expect(result).toBe(false) // Should match case-insensitively
    })

    it('should handle abort signals', async () => {
      const controller = new AbortController()
      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'

      mockApiRequest.mockRejectedValueOnce(abortError)

      await expect(
        CustomerApi.checkEmailAvailability({
          email: 'test@example.com',
          signal: controller.signal,
        })
      ).rejects.toThrow('Aborted')
    })

    it('should return true on non-abort errors to not block user', async () => {
      const networkError = new Error('Network error')
      mockApiRequest.mockRejectedValueOnce(networkError)

      const result = await CustomerApi.checkEmailAvailability({
        email: 'test@example.com',
      })

      expect(result).toBe(true) // Should assume available on error
    })
  })

  describe('getById', () => {
    it('should get customer by ID', async () => {
      const customerId = '1'
      const expectedCustomer = {
        id: customerId,
        name: 'Test Customer',
        email: 'test@example.com',
      }

      mockApiRequest.mockResolvedValueOnce(expectedCustomer)

      const result = await CustomerApi.getById(customerId)

      expect(mockApiRequest).toHaveBeenCalledWith({
        url: `/api/v1/customers/${customerId}`,
        method: 'GET',
        signal: undefined,
      })
      expect(result).toEqual(expectedCustomer)
    })
  })

  describe('delete', () => {
    it('should delete customer', async () => {
      const customerId = '1'

      mockApiRequest.mockResolvedValueOnce(undefined)

      await CustomerApi.delete(customerId)

      expect(mockApiRequest).toHaveBeenCalledWith({
        url: `/api/v1/customers/${customerId}`,
        method: 'DELETE',
      })
    })
  })
})
