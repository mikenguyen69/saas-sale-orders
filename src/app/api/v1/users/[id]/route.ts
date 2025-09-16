import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
  requireRole,
  validateRequest,
  ApiError,
} from '@/lib/api-utils'
import { UpdateUserSchema } from '@/lib/validations/user'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID. Users can view their own profile, managers can view any user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userDetails, supabase } = await getAuthenticatedUser(request)
    const { id: rawId } = params
    const id = rawId.trim()

    // Users can view their own profile, managers can view any user
    console.log('Debug - userDetails.id:', userDetails.id)
    console.log('Debug - requested id:', id)
    console.log('Debug - userDetails.role:', userDetails.role)

    if (userDetails.id !== id && userDetails.role !== 'manager') {
      throw new ApiError(403, 'Access denied')
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !user) {
      throw new ApiError(404, 'User not found')
    }

    return createSuccessResponse(user)
  } catch (error) {
    return createErrorResponse(error)
  }
}

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update a user's information. Users can update their own profile (except role), managers can update any user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *                 description: User role (only managers can change this)
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   example: User updated successfully
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
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userDetails, supabase } = await getAuthenticatedUser(request)
    const { id: rawId } = params
    const id = rawId.trim()

    // Users can update their own profile, managers can update any user
    const isOwnProfile = userDetails.id === id
    const isManager = userDetails.role === 'manager'

    if (!isOwnProfile && !isManager) {
      throw new ApiError(403, 'Access denied')
    }

    const updateData = await validateRequest(request, UpdateUserSchema)

    // Only managers can change roles
    if (updateData.role && !isManager) {
      throw new ApiError(403, 'Only managers can change user roles')
    }

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingUser) {
      throw new ApiError(404, 'User not found')
    }

    // Check if email already exists (if email is being updated)
    if (updateData.email && updateData.email !== existingUser.email) {
      const { data: emailUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', updateData.email)
        .neq('id', id)
        .is('deleted_at', null)
        .single()

      if (emailUser) {
        throw new ApiError(400, 'User with this email already exists')
      }
    }

    // Update the user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return createSuccessResponse(updatedUser, 'User updated successfully')
  } catch (error) {
    return createErrorResponse(error)
  }
}

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user (soft delete)
 *     description: Soft delete a user. Only managers can delete users. Users cannot delete their own account.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
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
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userDetails, supabase } = await getAuthenticatedUser(request)
    const { id: rawId } = params
    const id = rawId.trim()

    // Only managers can delete users
    requireRole(userDetails.role, ['manager'])

    // Prevent self-deletion
    if (userDetails.id === id) {
      throw new ApiError(403, 'You cannot delete your own account')
    }

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingUser) {
      throw new ApiError(404, 'User not found')
    }

    // Soft delete using the database function
    const { error } = await supabase.rpc('soft_delete_user', {
      user_id: id,
    })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return createSuccessResponse(null, 'User deleted successfully')
  } catch (error) {
    return createErrorResponse(error)
  }
}
