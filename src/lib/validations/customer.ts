import { z } from 'zod'

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200, 'Customer name too long'),
  contact_person: z
    .string()
    .min(1, 'Contact person is required')
    .max(100, 'Contact person name too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20, 'Phone number too long').optional(),
  shipping_address: z.string().max(500, 'Shipping address too long').optional(),
  billing_address: z.string().max(500, 'Billing address too long').optional(),
})

export const UpdateCustomerSchema = z.object({
  name: z
    .string()
    .min(1, 'Customer name is required')
    .max(200, 'Customer name too long')
    .optional(),
  contact_person: z
    .string()
    .min(1, 'Contact person is required')
    .max(100, 'Contact person name too long')
    .optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  shipping_address: z.string().max(500, 'Shipping address too long').optional(),
  billing_address: z.string().max(500, 'Billing address too long').optional(),
})

export const CustomerQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const CustomerSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
})

// Type exports for use in API routes
export type CreateCustomerRequest = z.infer<typeof CreateCustomerSchema>
export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerSchema>
export type CustomerQuery = z.infer<typeof CustomerQuerySchema>
export type CustomerSearch = z.infer<typeof CustomerSearchSchema>
