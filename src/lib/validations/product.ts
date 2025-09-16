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
  page: z.string().regex(/^\d+$/).default('1').transform(Number),
  limit: z
    .string()
    .regex(/^\d+$/)
    .default('20')
    .transform(val => {
      const num = Number(val)
      if (num > 100) throw new Error('Limit cannot exceed 100')
      return num
    }),
})

export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
export type ProductQuery = z.infer<typeof ProductQuerySchema>
