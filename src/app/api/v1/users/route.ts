import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  createPaginatedResponse,
  getAuthenticatedUser,
  requireRole,
  validateRequest,
  validateQuery,
} from '@/lib/api-utils'
import { CreateUserSchema, UserQuerySchema } from '@/lib/validations/user'

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a paginated list of users. Only managers can access this endpoint.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [salesperson, manager, warehouse]
 *         description: Filter by user role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include soft-deleted users
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrevious:
 *                       type: boolean
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied - Manager role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
export async function GET(request: NextRequest) {
  try {
    const { userDetails, supabase } = await getAuthenticatedUser(request)

    // Only managers can list all users
    requireRole(userDetails.role, ['manager'])

    const query = await validateQuery(request, UserQuerySchema)
    const { page = 1, limit = 20, role, search, includeDeleted } = query

    let queryBuilder = supabase.from('users').select('*', { count: 'exact' })

    // Apply filters
    if (!includeDeleted) {
      queryBuilder = queryBuilder.is('deleted_at', null)
    }

    if (role) {
      queryBuilder = queryBuilder.eq('role', role)
    }

    if (search) {
      queryBuilder = queryBuilder.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    queryBuilder = queryBuilder
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    const { data: users, error, count } = await queryBuilder

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return createPaginatedResponse(users || [], page, limit, count || 0)
  } catch (error) {
    return createErrorResponse(error)
  }
}

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user in the system. Only managers can create users.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               name:
 *                 type: string
 *                 description: Full name of the user
 *               role:
 *                 type: string
 *                 enum: [salesperson, manager, warehouse]
 *                 description: User role in the system
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *       400:
 *         description: Validation error or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied - Manager role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  try {
    const { userDetails, supabase } = await getAuthenticatedUser(request)

    // Only managers can create users
    requireRole(userDetails.role, ['manager'])

    const userData = await validateRequest(request, CreateUserSchema)

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .is('deleted_at', null)
      .single()

    if (existingUser) {
      return createErrorResponse(
        new Error('User with this email already exists'),
        'Email already exists'
      )
    }

    // Create the user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return createSuccessResponse(newUser, 'User created successfully', 201)
  } catch (error) {
    return createErrorResponse(error)
  }
}
