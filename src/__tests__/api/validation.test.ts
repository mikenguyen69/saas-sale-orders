import { describe, expect, it } from '@jest/globals'
import { CreateUserSchema, UpdateUserSchema, UserQuerySchema } from '@/lib/validations/user'

describe('API Validation Schemas', () => {
  describe('CreateUserSchema', () => {
    it('should validate correct user data', () => {
      const validUser = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'salesperson' as const,
      }

      const result = CreateUserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validUser)
      }
    })

    it('should reject invalid email', () => {
      const invalidUser = {
        email: 'invalid-email',
        name: 'Test User',
        role: 'salesperson' as const,
      }

      const result = CreateUserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address')
      }
    })

    it('should reject empty name', () => {
      const invalidUser = {
        email: 'test@example.com',
        name: '',
        role: 'salesperson' as const,
      }

      const result = CreateUserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is required')
      }
    })

    it('should reject invalid role', () => {
      const invalidUser = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'invalid-role',
      }

      const result = CreateUserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should require all fields', () => {
      const incompleteUser = {
        email: 'test@example.com',
        // Missing name and role
      }

      const result = CreateUserSchema.safeParse(incompleteUser)
      expect(result.success).toBe(false)
    })
  })

  describe('UpdateUserSchema', () => {
    it('should validate partial updates', () => {
      const partialUpdate = {
        name: 'Updated Name',
      }

      const result = UpdateUserSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Updated Name')
      }
    })

    it('should validate email update', () => {
      const emailUpdate = {
        email: 'newemail@example.com',
      }

      const result = UpdateUserSchema.safeParse(emailUpdate)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email in update', () => {
      const invalidUpdate = {
        email: 'invalid-email',
      }

      const result = UpdateUserSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })

    it('should allow empty update object', () => {
      const emptyUpdate = {}

      const result = UpdateUserSchema.safeParse(emptyUpdate)
      expect(result.success).toBe(true)
    })
  })

  describe('UserQuerySchema', () => {
    it('should provide defaults for query parameters', () => {
      const emptyQuery = {}

      const result = UserQuerySchema.safeParse(emptyQuery)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
        expect(result.data.includeDeleted).toBe(false)
      }
    })

    it('should validate custom pagination', () => {
      const customQuery = {
        page: '2',
        limit: '50',
      }

      const result = UserQuerySchema.safeParse(customQuery)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(50)
      }
    })

    it('should validate role filter', () => {
      const roleQuery = {
        role: 'manager',
      }

      const result = UserQuerySchema.safeParse(roleQuery)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('manager')
      }
    })

    it('should reject invalid pagination values', () => {
      const invalidQuery = {
        page: '0', // Below minimum
        limit: '200', // Above maximum
      }

      const result = UserQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })

    it('should validate search parameter', () => {
      const searchQuery = {
        search: 'john doe',
      }

      const result = UserQuerySchema.safeParse(searchQuery)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.search).toBe('john doe')
      }
    })

    it('should validate includeDeleted boolean', () => {
      const deletedQuery = {
        includeDeleted: 'true',
      }

      const result = UserQuerySchema.safeParse(deletedQuery)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.includeDeleted).toBe(true)
      }
    })
  })
})
