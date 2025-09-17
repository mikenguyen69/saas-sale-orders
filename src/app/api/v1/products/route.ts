import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  createPaginatedResponse,
  getAuthenticatedUser,
  requireRole,
  validateRequest,
  validateQuery,
  ApiError,
} from '@/lib/api-utils'
import { CreateProductSchema, ProductQuerySchema } from '@/lib/validations/product'

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: List products
 *     description: Get a paginated list of products with optional filtering
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search products by name or code
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by stock availability
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
 *         description: Products retrieved successfully
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
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
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
    const query = await validateQuery(request, ProductQuerySchema)

    console.log('User details:', userDetails)

    // Note: Removed mock data - now using real Supabase data

    let queryBuilder = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Apply filters
    if (query.search) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query.search}%,code.ilike.%${query.search}%`)
    }

    if (query.category) {
      queryBuilder = queryBuilder.eq('category', query.category)
    }

    if (query.inStock === 'true') {
      queryBuilder = queryBuilder.gt('stock_quantity', 0)
    } else if (query.inStock === 'false') {
      queryBuilder = queryBuilder.eq('stock_quantity', 0)
    }

    if (query.lowStock === 'true') {
      queryBuilder = queryBuilder.lte('stock_quantity', 10).gt('stock_quantity', 0)
    }

    // Apply pagination
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const offset = (page - 1) * limit
    console.log('Applying pagination:', { offset, limit, page })
    queryBuilder = queryBuilder.range(offset, offset + limit - 1).order('name')

    console.log('About to execute query...')

    const { data: products, error, count } = await queryBuilder

    console.log('Query result:', {
      productsLength: products?.length,
      productsFirst: products?.[0]?.name,
      error: error?.message,
      count: count,
      countType: typeof count,
      query,
    })

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    console.log('Final response data:', products)

    return createPaginatedResponse(products || [], page, limit, count || 0)
  } catch (error) {
    return createErrorResponse(error)
  }
}

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product. Only managers can create products.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, wholesalePrice, retailPrice, stockQuantity]
 *             properties:
 *               code:
 *                 type: string
 *                 description: Unique product code
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
 *                 default: 0
 *                 description: Tax rate (0-1)
 *               stockQuantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Initial stock quantity
 *     responses:
 *       201:
 *         description: Product created successfully
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
 *                   example: Product created successfully
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
 */
export async function POST(request: NextRequest) {
  try {
    const { userDetails, supabase } = await getAuthenticatedUser(request)

    // Only managers can create products
    requireRole(userDetails.role, ['manager'])

    const productData = await validateRequest(request, CreateProductSchema)

    // Check if product code already exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('code', productData.code)
      .is('deleted_at', null)
      .single()

    if (existingProduct) {
      throw new ApiError(400, 'Product with this code already exists')
    }

    // Create the product
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return createSuccessResponse(newProduct, 'Product created successfully', 201)
  } catch (error) {
    return createErrorResponse(error)
  }
}
