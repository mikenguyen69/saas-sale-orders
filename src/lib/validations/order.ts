import { z } from 'zod'

export const OrderItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be positive'),
})

export const CreateOrderSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required').max(200, 'Customer name too long'),
  contact_person: z
    .string()
    .min(1, 'Contact person is required')
    .max(100, 'Contact person name too long'),
  email: z.string().email('Invalid email address'),
  shipping_address: z.string().max(500, 'Shipping address too long').optional(),
  delivery_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
})

export const UpdateOrderSchema = z.object({
  customer_name: z
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
  shipping_address: z.string().max(500, 'Shipping address too long').optional(),
  delivery_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  items: z.array(OrderItemSchema).min(1, 'At least one item is required').optional(),
})

export const OrderQuerySchema = z.object({
  status: z
    .enum([
      'draft',
      'submitted',
      'approved',
      'packing',
      'packed',
      'shipped',
      'delivered',
      'fulfilled',
      'rejected',
    ])
    .optional(),
  salesperson_id: z.string().uuid().optional(),
  customer_id: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const WorkflowActionSchema = z.object({
  notes: z.string().max(1000, 'Notes too long').optional(),
})

export const FulfillOrderSchema = z.object({
  items: z
    .array(
      z.object({
        orderItemId: z.string().uuid('Invalid order item ID'),
        fulfilledQuantity: z.number().int().min(0, 'Fulfilled quantity must be non-negative'),
      })
    )
    .min(1, 'At least one item must be specified'),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>
export type OrderQuery = z.infer<typeof OrderQuerySchema>
export type WorkflowActionInput = z.infer<typeof WorkflowActionSchema>
export type FulfillOrderInput = z.infer<typeof FulfillOrderSchema>
