import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
  validateRequest,
  validateQuery,
  ApiError,
} from '@/lib/api-utils'
import { CreateOrderSchema, OrderQuerySchema } from '@/lib/validations/order'

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: List orders
 *     description: Get a paginated list of orders with role-based filtering
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, approved, fulfilled, rejected]
 *         description: Filter by order status
 *       - in: query
 *         name: salespersonId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by salesperson ID
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer name
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
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SaleOrder'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    const { userDetails, supabase } = await getAuthenticatedUser(request)
    const query = await validateQuery(request, OrderQuerySchema)

    let queryBuilder = supabase
      .from('sale_orders')
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
          is_in_stock,
          line_status,
          product:products(id, code, name, stock_quantity)
        )
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null)

    // Role-based filtering
    if (userDetails.role === 'salesperson') {
      // Salespeople can only see their own orders
      queryBuilder = queryBuilder.eq('salesperson_id', userDetails.id)
    }

    // Apply filters
    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status)
    }

    if (query.salespersonId) {
      // Only managers can filter by other salespeople
      if (userDetails.role !== 'manager') {
        throw new ApiError(403, 'Access denied')
      }
      queryBuilder = queryBuilder.eq('salesperson_id', query.salespersonId)
    }

    if (query.customerId) {
      queryBuilder = queryBuilder.ilike('customer_name', `%${query.customerId}%`)
    }

    // Apply pagination
    const offset = (query.page - 1) * query.limit
    queryBuilder = queryBuilder
      .range(offset, offset + query.limit - 1)
      .order('created_at', { ascending: false })

    const { data: orders, error, count } = await queryBuilder

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    const totalPages = Math.ceil((count || 0) / query.limit)

    return createSuccessResponse({
      orders: orders || [],
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count || 0,
        totalPages,
      },
    })
  } catch (error) {
    return createErrorResponse(error)
  }
}

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create a new order
 *     description: Create a new draft order with items
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerName, contactPerson, email, items]
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
 *       201:
 *         description: Order created successfully
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
 *                   example: Order created successfully
 *       400:
 *         description: Validation error
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
 */
export async function POST(request: NextRequest) {
  try {
    const { userDetails, supabase } = await getAuthenticatedUser(request)
    const orderData = await validateRequest(request, CreateOrderSchema)

    // Start a transaction
    const { data: order, error: orderError } = await supabase
      .from('sale_orders')
      .insert({
        customer_name: orderData.customerName,
        contact_person: orderData.contactPerson,
        email: orderData.email,
        shipping_address: orderData.shippingAddress,
        delivery_date: orderData.deliveryDate,
        notes: orderData.notes,
        status: 'draft',
        salesperson_id: userDetails.id,
      })
      .select()
      .single()

    if (orderError) {
      throw new Error(`Database error: ${orderError.message}`)
    }

    // Validate products exist and calculate line totals
    const itemsToInsert = []
    for (const item of orderData.items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, stock_quantity')
        .eq('id', item.productId)
        .is('deleted_at', null)
        .single()

      if (productError || !product) {
        throw new ApiError(400, `Product ${item.productId} not found`)
      }

      const lineTotal = item.quantity * item.unitPrice
      const isInStock = product.stock_quantity >= item.quantity

      itemsToInsert.push({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: lineTotal,
        is_in_stock: isInStock,
        line_status: 'pending',
      })
    }

    // Insert order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert).select(`
        *,
        product:products(id, code, name, stock_quantity)
      `)

    if (itemsError) {
      throw new Error(`Database error: ${itemsError.message}`)
    }

    // Return the complete order with items
    const completeOrder = {
      ...order,
      items,
    }

    return createSuccessResponse(completeOrder, 'Order created successfully', 201)
  } catch (error) {
    return createErrorResponse(error)
  }
}
