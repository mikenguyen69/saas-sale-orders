import { z } from 'zod'

export const UserRoleSchema = z.enum(['salesperson', 'manager', 'warehouse'])

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: UserRoleSchema,
})

export const UpdateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  role: UserRoleSchema.optional(),
})

export const UserQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  role: UserRoleSchema.optional(),
  search: z.string().optional(),
  includeDeleted: z.coerce.boolean().default(false),
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type UserQuery = z.infer<typeof UserQuerySchema>
