import { Customer, CustomerCreateData } from '@/types'
import { apiRequest } from '@/utils/api'

export interface CheckEmailAvailabilityParams {
  email: string
  excludeCustomerId?: string
  signal?: AbortSignal
}

export interface CustomerSearchParams {
  search?: string
  limit?: number
  offset?: number
  signal?: AbortSignal
}

export class CustomerApi {
  private static readonly BASE_URL = '/api/v1/customers'

  static async create(data: CustomerCreateData): Promise<Customer> {
    return apiRequest<Customer>({
      url: this.BASE_URL,
      method: 'POST',
      data,
    })
  }

  static async update(id: string, data: CustomerCreateData): Promise<Customer> {
    return apiRequest<Customer>({
      url: `${this.BASE_URL}/${id}`,
      method: 'PUT',
      data,
    })
  }

  static async getById(id: string, signal?: AbortSignal): Promise<Customer> {
    return apiRequest<Customer>({
      url: `${this.BASE_URL}/${id}`,
      method: 'GET',
      signal,
    })
  }

  static async search(params: CustomerSearchParams = {}): Promise<Customer[]> {
    const searchParams = new URLSearchParams()

    if (params.search) searchParams.append('search', params.search)
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.offset !== undefined) searchParams.append('offset', params.offset.toString())

    const url = searchParams.toString()
      ? `${this.BASE_URL}?${searchParams.toString()}`
      : this.BASE_URL

    return apiRequest<Customer[]>({
      url,
      method: 'GET',
      signal: params.signal,
    })
  }

  static async checkEmailAvailability({
    email,
    excludeCustomerId,
    signal,
  }: CheckEmailAvailabilityParams): Promise<boolean> {
    try {
      const customers = await this.search({
        search: email,
        limit: 1,
        signal,
      })

      if (customers.length === 0) {
        return true // Email is available
      }

      const existingCustomer = customers[0]

      // Check if the email matches exactly (case-insensitive)
      const emailMatches = existingCustomer.email.toLowerCase() === email.toLowerCase()

      // If we're excluding a specific customer (edit mode), check if it's the same customer
      if (emailMatches && excludeCustomerId && existingCustomer.id === excludeCustomerId) {
        return true // Same customer, email is available for them
      }

      return !emailMatches // Email is available if it doesn't match
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }
      console.error('Error checking email availability:', error)
      return true // Assume available on error to not block user
    }
  }

  static async delete(id: string): Promise<void> {
    return apiRequest<void>({
      url: `${this.BASE_URL}/${id}`,
      method: 'DELETE',
    })
  }
}
