import { z } from 'zod'

export const CreateProductSchema = z.object({
  code: z.string().min(1, 'Product code is required').max(50, 'Product code too long'),
  name: z.string().min(1, 'Product name is required').max(200, 'Product name too long'),
  category: z.string().max(100, 'Category too long').optional(),
  wholesale_price: z.number().min(0, 'Wholesale price must be positive'),
  retail_price: z.number().min(0, 'Retail price must be positive'),
  tax_rate: z
    .number()
    .min(0, 'Tax rate must be positive')
    .max(1, 'Tax rate cannot exceed 100%')
    .default(0),
  stock_quantity: z.number().int().min(0, 'Stock quantity must be non-negative'),
})

export const UpdateProductSchema = CreateProductSchema.partial()

export const ProductQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  inStock: z.enum(['true', 'false']).optional(),
  lowStock: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
export type ProductQuery = z.infer<typeof ProductQuerySchema>
