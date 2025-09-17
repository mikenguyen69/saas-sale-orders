import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
  validateRequest,
  ApiError,
} from '@/lib/api-utils'
import { UpdateOrderSchema } from '@/lib/validations/order'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     description: Retrieve a specific order with its items
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
 *     responses:
 *       200:
 *         description: Order retrieved successfully
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
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userDetails, supabase } = await getAuthenticatedUser(request)
    const { id } = params

    const { data: order, error } = await supabase
      .from('sale_orders')
      .select(
        `
        *,
        salesperson:users!salesperson_id(id, name, email),
        manager:users!manager_id(id, name, email),
        warehouse:users!warehouse_id(id, name, email),
        order_items(
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
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !order) {
      throw new ApiError(404, 'Order not found')
    }

    // Role-based access control
    if (userDetails.role === 'salesperson' && order.salesperson_id !== userDetails.id) {
      throw new ApiError(403, 'Access denied')
    }

    return createSuccessResponse(order)
  } catch (error) {
    return createErrorResponse(error)
  }
}

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   put:
 *     summary: Update order
 *     description: Update an order (only draft orders can be updated by salespeople)
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
 *             properties:
 *               customerName:
 *                 type: string
 *                 description: Customer company name
 *                 maxLength: 200
 *               contactPerson:
 *                 type: string
 *                 description: Primary contact person
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *               shippingAddress:
 *                 type: string
 *                 description: Shipping address
 *                 maxLength: 500
 *               deliveryDate:
 *                 type: string
 *                 format: date
 *                 description: Expected delivery date (YYYY-MM-DD)
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *                 maxLength: 1000
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [productId, quantity, unitPrice]
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                       description: Product ID
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Order quantity
 *                     unitPrice:
 *                       type: number
 *                       minimum: 0
 *                       description: Unit price
 *     responses:
 *       200:
 *         description: Order updated successfully
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
 *                   example: Order updated successfully
 *       400:
 *         description: Validation error or order cannot be updated
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
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userDetails, supabase } = await getAuthenticatedUser(request)
    const { id } = params
    const updateData = await validateRequest(request, UpdateOrderSchema)

    // Check if order exists and get current state
    const { data: existingOrder, error: fetchError } = await supabase
      .from('sale_orders')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingOrder) {
      throw new ApiError(404, 'Order not found')
    }

    // Role-based access control
    if (userDetails.role === 'salesperson') {
      // Salespeople can only update their own draft orders
      if (existingOrder.salesperson_id !== userDetails.id) {
        throw new ApiError(403, 'Access denied')
      }
      if (existingOrder.status !== 'draft') {
        throw new ApiError(400, 'Only draft orders can be updated')
      }
    } else if (userDetails.role === 'manager') {
      // Managers can update orders in any status except fulfilled
      if (existingOrder.status === 'fulfilled') {
        throw new ApiError(400, 'Fulfilled orders cannot be updated')
      }
    }

    // Update order details (excluding items for now)
    const orderUpdate = {
      customer_name: updateData.customer_name,
      contact_person: updateData.contact_person,
      email: updateData.email,
      shipping_address: updateData.shipping_address,
      delivery_date: updateData.delivery_date,
      notes: updateData.notes,
    }

    // Remove undefined fields
    Object.keys(orderUpdate).forEach(key => {
      if ((orderUpdate as any)[key] === undefined) {
        delete (orderUpdate as any)[key]
      }
    })

    const { data: updatedOrder, error: updateError } = await supabase
      .from('sale_orders')
      .update(orderUpdate)
      .eq('id', id)
      .select(
        `
        *,
        salesperson:users!salesperson_id(id, name, email),
        manager:users!manager_id(id, name, email),
        warehouse:users!warehouse_id(id, name, email)
      `
      )
      .single()

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`)
    }

    // Handle items update if provided
    if (updateData.items) {
      // Delete existing items
      await supabase.from('order_items').delete().eq('order_id', id)

      // Validate and insert new items
      const itemsToInsert = []
      for (const item of updateData.items) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, stock_quantity')
          .eq('id', item.product_id)
          .is('deleted_at', null)
          .single()

        if (productError || !product) {
          throw new ApiError(400, `Product ${item.product_id} not found`)
        }

        const lineTotal = item.quantity * item.unit_price
        const isInStock = product.stock_quantity >= item.quantity

        itemsToInsert.push({
          order_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: lineTotal,
          is_in_stock: isInStock,
          line_status: 'pending' as const,
        })
      }

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert).select(`
          *,
          product:products(id, code, name, stock_quantity)
        `)

      if (itemsError) {
        throw new Error(`Database error: ${itemsError.message}`)
      }

      ;(updatedOrder as any).order_items = items
    } else {
      // Get existing items
      const { data: items } = await supabase
        .from('order_items')
        .select(
          `
          *,
          product:products(id, code, name, stock_quantity)
        `
        )
        .eq('order_id', id)

      ;(updatedOrder as any).order_items = items || []
    }

    return createSuccessResponse(updatedOrder, 'Order updated successfully')
  } catch (error) {
    return createErrorResponse(error)
  }
}

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   delete:
 *     summary: Delete order (soft delete)
 *     description: Soft delete an order. Only draft orders can be deleted.
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
 *     responses:
 *       200:
 *         description: Order deleted successfully
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
 *                   example: Order deleted successfully
 *       400:
 *         description: Order cannot be deleted
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
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userDetails, supabase } = await getAuthenticatedUser(request)
    const { id } = params

    // Check if order exists
    const { data: existingOrder, error: fetchError } = await supabase
      .from('sale_orders')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingOrder) {
      throw new ApiError(404, 'Order not found')
    }

    // Role-based access control
    if (userDetails.role === 'salesperson') {
      // Salespeople can only delete their own draft orders
      if (existingOrder.salesperson_id !== userDetails.id) {
        throw new ApiError(403, 'Access denied')
      }
      if (existingOrder.status !== 'draft') {
        throw new ApiError(400, 'Only draft orders can be deleted')
      }
    } else if (userDetails.role === 'manager') {
      // Managers can delete orders except fulfilled ones
      if (existingOrder.status === 'fulfilled') {
        throw new ApiError(400, 'Fulfilled orders cannot be deleted')
      }
    }

    // Soft delete the order
    const { error } = await supabase
      .from('sale_orders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return createSuccessResponse(null, 'Order deleted successfully')
  } catch (error) {
    return createErrorResponse(error)
  }
}
