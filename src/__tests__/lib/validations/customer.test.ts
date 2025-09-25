import { describe, expect, it } from '@jest/globals'
import {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  CustomerQuerySchema,
  CustomerSearchSchema,
} from '@/lib/validations/customer'

describe('Customer Validation Schemas', () => {
  describe('CreateCustomerSchema', () => {
    it('should validate correct customer data', () => {
      const validCustomer = {
        name: 'Test Company',
        contact_person: 'John Doe',
        email: 'john@testcompany.com',
        phone: '+1-555-123-4567',
        shipping_address: '123 Main St, City, State 12345',
        billing_address: '456 Oak Ave, City, State 12345',
      }

      const result = CreateCustomerSchema.safeParse(validCustomer)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validCustomer)
      }
    })

    it('should validate minimal required fields', () => {
      const minimalCustomer = {
        name: 'Test Company',
        contact_person: 'John Doe',
        email: 'john@testcompany.com',
      }

      const result = CreateCustomerSchema.safeParse(minimalCustomer)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(minimalCustomer)
      }
    })

    it('should reject missing required fields', () => {
      const invalidCustomer = {
        name: 'Test Company',
        // missing contact_person and email
      }

      const result = CreateCustomerSchema.safeParse(invalidCustomer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2)
        expect(result.error.issues.some(issue => issue.path.includes('contact_person'))).toBe(true)
        expect(result.error.issues.some(issue => issue.path.includes('email'))).toBe(true)
      }
    })

    it('should reject invalid email format', () => {
      const invalidCustomer = {
        name: 'Test Company',
        contact_person: 'John Doe',
        email: 'invalid-email',
      }

      const result = CreateCustomerSchema.safeParse(invalidCustomer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address')
      }
    })

    it('should reject empty name', () => {
      const invalidCustomer = {
        name: '',
        contact_person: 'John Doe',
        email: 'john@testcompany.com',
      }

      const result = CreateCustomerSchema.safeParse(invalidCustomer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Customer name is required')
      }
    })

    it('should reject names that are too long', () => {
      const invalidCustomer = {
        name: 'A'.repeat(201), // Exceeds 200 character limit
        contact_person: 'John Doe',
        email: 'john@testcompany.com',
      }

      const result = CreateCustomerSchema.safeParse(invalidCustomer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Customer name too long')
      }
    })

    it('should reject contact person names that are too long', () => {
      const invalidCustomer = {
        name: 'Test Company',
        contact_person: 'A'.repeat(101), // Exceeds 100 character limit
        email: 'john@testcompany.com',
      }

      const result = CreateCustomerSchema.safeParse(invalidCustomer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Contact person name too long')
      }
    })

    it('should reject phone numbers that are too long', () => {
      const invalidCustomer = {
        name: 'Test Company',
        contact_person: 'John Doe',
        email: 'john@testcompany.com',
        phone: 'A'.repeat(21), // Exceeds 20 character limit
      }

      const result = CreateCustomerSchema.safeParse(invalidCustomer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Phone number too long')
      }
    })

    it('should reject addresses that are too long', () => {
      const invalidCustomer = {
        name: 'Test Company',
        contact_person: 'John Doe',
        email: 'john@testcompany.com',
        shipping_address: 'A'.repeat(501), // Exceeds 500 character limit
      }

      const result = CreateCustomerSchema.safeParse(invalidCustomer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Shipping address too long')
      }
    })
  })

  describe('UpdateCustomerSchema', () => {
    it('should validate partial customer updates', () => {
      const partialUpdate = {
        name: 'Updated Company',
        email: 'updated@testcompany.com',
      }

      const result = UpdateCustomerSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(partialUpdate)
      }
    })

    it('should validate empty update object', () => {
      const emptyUpdate = {}

      const result = UpdateCustomerSchema.safeParse(emptyUpdate)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(emptyUpdate)
      }
    })

    it('should validate single field update', () => {
      const singleFieldUpdate = {
        phone: '+1-555-999-8888',
      }

      const result = UpdateCustomerSchema.safeParse(singleFieldUpdate)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(singleFieldUpdate)
      }
    })

    it('should reject invalid email in update', () => {
      const invalidUpdate = {
        email: 'invalid-email',
      }

      const result = UpdateCustomerSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address')
      }
    })

    it('should reject empty name in update', () => {
      const invalidUpdate = {
        name: '',
      }

      const result = UpdateCustomerSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Customer name is required')
      }
    })
  })

  describe('CustomerQuerySchema', () => {
    it('should validate query with all parameters', () => {
      const query = {
        search: 'test company',
        page: '2',
        limit: '10',
      }

      const result = CustomerQuerySchema.safeParse(query)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          search: 'test company',
          page: 2,
          limit: 10,
        })
      }
    })

    it('should apply defaults for missing parameters', () => {
      const query = {}

      const result = CustomerQuerySchema.safeParse(query)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          page: 1,
          limit: 20,
        })
      }
    })

    it('should validate search-only query', () => {
      const query = {
        search: 'acme',
      }

      const result = CustomerQuerySchema.safeParse(query)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.search).toBe('acme')
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should coerce string numbers to integers', () => {
      const query = {
        page: '5',
        limit: '50',
      }

      const result = CustomerQuerySchema.safeParse(query)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(5)
        expect(result.data.limit).toBe(50)
      }
    })

    it('should reject invalid page numbers', () => {
      const query = {
        page: '0',
      }

      const result = CustomerQuerySchema.safeParse(query)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Number must be greater than or equal to 1'
        )
      }
    })

    it('should reject limit that exceeds maximum', () => {
      const query = {
        limit: '101',
      }

      const result = CustomerQuerySchema.safeParse(query)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Number must be less than or equal to 100')
      }
    })
  })

  describe('CustomerSearchSchema', () => {
    it('should validate search query', () => {
      const search = {
        q: 'test company',
      }

      const result = CustomerSearchSchema.safeParse(search)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(search)
      }
    })

    it('should reject empty search query', () => {
      const search = {
        q: '',
      }

      const result = CustomerSearchSchema.safeParse(search)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Search query is required')
      }
    })

    it('should reject missing search query', () => {
      const search = {}

      const result = CustomerSearchSchema.safeParse(search)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type')
      }
    })
  })
})
