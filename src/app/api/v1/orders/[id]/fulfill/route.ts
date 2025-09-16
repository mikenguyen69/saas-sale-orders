import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
  requireRole,
  validateRequest,
  ApiError,
} from '@/lib/api-utils'
import { FulfillOrderSchema } from '@/lib/validations/order'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * @swagger
 * /api/v1/orders/{id}/fulfill:
 *   post:
 *     summary: Fulfill order (partial or complete)
 *     description: Fulfill an approved order. Supports partial fulfillment. Only warehouse staff can fulfill orders.
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [orderItemId, fulfilledQuantity]
 *                   properties:
 *                     orderItemId:
 *                       type: string
 *                       format: uuid
 *                       description: Order item ID
 *                     fulfilledQuantity:
 *                       type: integer
 *                       minimum: 0
 *                       description: Quantity being fulfilled
 *               notes:
 *                 type: string
 *                 description: Fulfillment notes
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Order fulfilled successfully
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
 *                   example: Order fulfilled successfully
 *       400:
 *         description: Order cannot be fulfilled or validation error
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
    const { items, notes } = await validateRequest(request, FulfillOrderSchema)

    // Only warehouse staff can fulfill orders
    requireRole(userDetails.role, ['warehouse'])

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
          fulfilled_quantity,
          line_status,
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

    // Order must be in approved status
    if (order.status !== 'approved') {
      throw new ApiError(400, 'Only approved orders can be fulfilled')
    }

    // Validate fulfillment items and check stock
    const fulfillmentUpdates = []
    const stockUpdates = []

    for (const fulfillItem of items) {
      const orderItem = order.items.find(item => item.id === fulfillItem.orderItemId)

      if (!orderItem) {
        throw new ApiError(400, `Order item ${fulfillItem.orderItemId} not found`)
      }

      const currentFulfilled = orderItem.fulfilled_quantity || 0
      const remainingToFulfill = orderItem.quantity - currentFulfilled

      if (fulfillItem.fulfilledQuantity > remainingToFulfill) {
        throw new ApiError(
          400,
          `Cannot fulfill ${fulfillItem.fulfilledQuantity} of item ${orderItem.product.name}. Only ${remainingToFulfill} remaining.`
        )
      }

      if (fulfillItem.fulfilledQuantity > orderItem.product.stock_quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for ${orderItem.product.name}. Available: ${orderItem.product.stock_quantity}, Requested: ${fulfillItem.fulfilledQuantity}`
        )
      }

      const newFulfilledQuantity = currentFulfilled + fulfillItem.fulfilledQuantity
      const newLineStatus =
        newFulfilledQuantity >= orderItem.quantity ? 'fulfilled' : 'partially_fulfilled'

      fulfillmentUpdates.push({
        orderItemId: fulfillItem.orderItemId,
        fulfilledQuantity: newFulfilledQuantity,
        lineStatus: newLineStatus,
      })

      // Prepare stock update
      if (fulfillItem.fulfilledQuantity > 0) {
        stockUpdates.push({
          productId: orderItem.product_id,
          quantityToDeduct: fulfillItem.fulfilledQuantity,
        })
      }
    }

    // Update order items with fulfillment info
    for (const update of fulfillmentUpdates) {
      await supabase
        .from('order_items')
        .update({
          fulfilled_quantity: update.fulfilledQuantity,
          line_status: update.lineStatus,
        })
        .eq('id', update.orderItemId)
    }

    // Update product stock quantities
    for (const stockUpdate of stockUpdates) {
      await supabase.rpc('decrement_product_stock', {
        product_id: stockUpdate.productId,
        quantity: stockUpdate.quantityToDeduct,
      })
    }

    // Check if all items are fully fulfilled
    const { data: updatedItems } = await supabase
      .from('order_items')
      .select('quantity, fulfilled_quantity')
      .eq('order_id', id)

    const allItemsFulfilled = updatedItems.every(
      item => (item.fulfilled_quantity || 0) >= item.quantity
    )

    // Update order status if fully fulfilled
    const newOrderStatus = allItemsFulfilled ? 'fulfilled' : 'approved'

    const { data: updatedOrder, error: updateError } = await supabase
      .from('sale_orders')
      .update({
        status: newOrderStatus,
        warehouse_id: userDetails.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        salesperson:users!salesperson_id(id, name, email),
        manager:users!manager_id(id, name, email),
        warehouse:users!warehouse_id(id, name, email),
        items:order_items(
          id,
          product_id,
          quantity,
          unit_price,
          line_total,
          fulfilled_quantity,
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
    const historyNotes = allItemsFulfilled
      ? `Order fully fulfilled${notes ? `: ${notes}` : ''}`
      : `Order partially fulfilled${notes ? `: ${notes}` : ''}`

    await supabase.from('order_status_history').insert({
      order_id: id,
      status: newOrderStatus,
      changed_by: userDetails.id,
      notes: historyNotes,
    })

    const message = allItemsFulfilled ? 'Order fulfilled successfully' : 'Order partially fulfilled'

    return createSuccessResponse(updatedOrder, message)
  } catch (error) {
    return createErrorResponse(error)
  }
}
