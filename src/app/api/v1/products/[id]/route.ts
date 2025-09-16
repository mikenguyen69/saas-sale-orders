import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
  requireRole,
  validateRequest,
  ApiError,
} from '@/lib/api-utils'
import { UpdateProductSchema } from '@/lib/validations/product'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieve a specific product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { supabase } = await getAuthenticatedUser(request)
    const { id } = params

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !product) {
      throw new ApiError(404, 'Product not found')
    }

    return createSuccessResponse(product)
  } catch (error) {
    return createErrorResponse(error)
  }
}

/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Update product
 *     description: Update a product's information. Only managers can update products.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Product code
 *                 maxLength: 50
 *               name:
 *                 type: string
 *                 description: Product name
 *                 maxLength: 200
 *               category:
 *                 type: string
 *                 description: Product category
 *                 maxLength: 100
 *               wholesalePrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Wholesale price
 *               retailPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Retail price
 *               taxRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Tax rate (0-1)
 *               stockQuantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Stock quantity
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *                 message:
 *                   type: string
 *                   example: Product updated successfully
 *       400:
 *         description: Validation error or product code already exists
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
 *         description: Manager role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userDetails, supabase } = await getAuthenticatedUser(request)
    const { id } = params

    // Only managers can update products
    requireRole(userDetails.role, ['manager'])

    const updateData = await validateRequest(request, UpdateProductSchema)

    // Check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingProduct) {
      throw new ApiError(404, 'Product not found')
    }

    // Check if product code already exists (if code is being updated)
    if (updateData.code && updateData.code !== existingProduct.code) {
      const { data: codeProduct } = await supabase
        .from('products')
        .select('id')
        .eq('code', updateData.code)
        .neq('id', id)
        .is('deleted_at', null)
        .single()

      if (codeProduct) {
        throw new ApiError(400, 'Product with this code already exists')
      }
    }

    // Update the product
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return createSuccessResponse(updatedProduct, 'Product updated successfully')
  } catch (error) {
    return createErrorResponse(error)
  }
}

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Delete product (soft delete)
 *     description: Soft delete a product. Only managers can delete products.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
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
 *                   example: Product deleted successfully
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Manager role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userDetails, supabase } = await getAuthenticatedUser(request)
    const { id } = params

    // Only managers can delete products
    requireRole(userDetails.role, ['manager'])

    // Check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingProduct) {
      throw new ApiError(404, 'Product not found')
    }

    // Soft delete the product
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return createSuccessResponse(null, 'Product deleted successfully')
  } catch (error) {
    return createErrorResponse(error)
  }
}
