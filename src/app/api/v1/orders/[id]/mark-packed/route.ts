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
 * /api/v1/orders/{id}/mark-packed:
 *   post:
 *     summary: Mark order as packed
 *     description: Mark a packing order as packed and ready for shipment. Only warehouse staff can mark orders as packed.
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
 *                 description: Additional notes for packing completion
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Order marked as packed successfully
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
 *                   example: Order marked as packed successfully
 *       400:
 *         description: Order cannot be marked as packed
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
 *         description: Warehouse role required
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

    // Only warehouse staff can mark orders as packed
    requireRole(userDetails.role, ['warehouse'])

    // Get the order
    const { data: order, error: fetchError } = await supabase
      .from('sale_orders')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !order) {
      throw new ApiError(404, 'Order not found')
    }

    // Order must be in packing status
    if ((order.status as string) !== 'packing') {
      throw new ApiError(400, 'Only packing orders can be marked as packed')
    }

    // Update order status to packed
    const updateData: any = {
      status: 'packed',
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
        warehouse_staff:users!warehouse_id(id, name, email),
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
      previous_status: (order.status as string) || 'packing',
      new_status: 'packed',
      changed_by: userDetails.id,
    })

    return createSuccessResponse(updatedOrder, 'Order marked as packed successfully')
  } catch (error) {
    return createErrorResponse(error)
  }
}
