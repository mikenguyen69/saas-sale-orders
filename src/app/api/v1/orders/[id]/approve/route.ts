import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
  requireRole,
  ApiError,
} from '@/lib/api-utils'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * @swagger
 * /api/v1/orders/{id}/approve:
 *   post:
 *     summary: Approve order
 *     description: Approve a submitted order. Only managers can approve orders.
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
 *                 description: Additional notes for approval
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Order approved successfully
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
 *                   example: Order approved successfully
 *       400:
 *         description: Order cannot be approved
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
 *         description: Manager role required
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

    // Parse request body for notes
    const body = await request.json().catch(() => ({}))
    const { notes } = body

    // Only managers can approve orders
    requireRole(userDetails.role, ['manager'])

    // Get the order
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

    // Order must be in submitted status
    if (order.status !== 'submitted') {
      throw new ApiError(400, 'Only submitted orders can be approved')
    }

    // Re-validate stock availability at approval time
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

    // Update order status to approved
    const updateData: any = {
      status: 'approved',
      manager_id: userDetails.id,
      updated_at: new Date().toISOString(),
    }

    // Add notes if provided
    if (notes && typeof notes === 'string') {
      updateData.notes = notes.substring(0, 1000) // Limit to 1000 characters as per API spec
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('sale_orders')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        salesperson:users!salesperson_id(id, name, email),
        manager:users!manager_id(id, name, email),
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
      previous_status: order.status,
      new_status: 'approved',
      changed_by: userDetails.id,
    })

    return createSuccessResponse(updatedOrder, 'Order approved successfully')
  } catch (error) {
    return createErrorResponse(error)
  }
}
