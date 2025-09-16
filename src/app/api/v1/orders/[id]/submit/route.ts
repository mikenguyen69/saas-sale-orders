import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
  validateRequest,
  ApiError,
} from '@/lib/api-utils'
import { WorkflowActionSchema } from '@/lib/validations/order'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * @swagger
 * /api/v1/orders/{id}/submit:
 *   post:
 *     summary: Submit order for approval
 *     description: Submit a draft order for manager approval. Validates stock availability.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Additional notes for submission
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Order submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SaleOrder'
 *                 message:
 *                   type: string
 *                   example: Order submitted for approval
 *       400:
 *         description: Order cannot be submitted or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userDetails, supabase } = await getAuthenticatedUser(request)
    const { id } = params
    const { notes } = await validateRequest(request, WorkflowActionSchema)

    // Get the order with items
    const { data: order, error: fetchError } = await supabase
      .from('sale_orders')
      .select(
        `
        *,
        items:order_items(
          id,
          product_id,
          quantity,
          unit_price,
          line_total,
          product:products(id, code, name, stock_quantity)
        )
      `
      )
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !order) {
      throw new ApiError(404, 'Order not found')
    }

    // Only the salesperson who created the order can submit it
    if (order.salesperson_id !== userDetails.id) {
      throw new ApiError(403, 'Only the order creator can submit the order')
    }

    // Order must be in draft status
    if (order.status !== 'draft') {
      throw new ApiError(400, 'Only draft orders can be submitted')
    }

    // Validate stock availability for all items
    const stockIssues = []
    for (const item of order.items) {
      if (item.product.stock_quantity < item.quantity) {
        stockIssues.push({
          product: item.product.name,
          requested: item.quantity,
          available: item.product.stock_quantity,
        })
      }
    }

    if (stockIssues.length > 0) {
      throw new ApiError(400, 'Insufficient stock for some items', { stockIssues })
    }

    // Update order status to submitted
    const { data: updatedOrder, error: updateError } = await supabase
      .from('sale_orders')
      .update({
        status: 'submitted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        salesperson:users!salesperson_id(id, name, email),
        items:order_items(
          id,
          product_id,
          quantity,
          unit_price,
          line_total,
          is_in_stock,
          line_status,
          product:products(id, code, name, stock_quantity)
        )
      `
      )
      .single()

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`)
    }

    // Log status change in order history
    await supabase.from('order_status_history').insert({
      order_id: id,
      status: 'submitted',
      changed_by: userDetails.id,
      notes: notes || 'Order submitted for approval',
    })

    return createSuccessResponse(updatedOrder, 'Order submitted for approval')
  } catch (error) {
    return createErrorResponse(error)
  }
}
