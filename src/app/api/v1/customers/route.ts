import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  createPaginatedResponse,
  getAuthenticatedUser,
  validateRequest,
  validateQuery,
  ApiError,
} from '@/lib/api-utils'
import { CreateCustomerSchema, CustomerQuerySchema } from '@/lib/validations/customer'
import { CustomerService } from '@/services/customerService'

/**
 * @swagger
 * /api/v1/customers:
 *   get:
 *     summary: List customers
 *     description: Get a paginated list of customers with search functionality
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by customer name, email, or contact person
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
 *         description: Customers retrieved successfully
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
 *                     $ref: '#/components/schemas/Customer'
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
 */
export async function GET(request: NextRequest) {
  try {
    const { userDetails } = await getAuthenticatedUser(request)
    const query = await validateQuery(request, CustomerQuerySchema)

    // Only salespeople and managers can access customers
    if (!['salesperson', 'manager'].includes(userDetails.role)) {
      throw new ApiError(403, 'Access denied. Only salespeople and managers can access customers.')
    }

    const result = await CustomerService.listCustomers(userDetails.id, {
      search: query.search,
      page: query.page,
      limit: query.limit,
    })

    return createPaginatedResponse(
      result.customers,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total
    )
  } catch (error) {
    return createErrorResponse(error)
  }
}

/**
 * @swagger
 * /api/v1/customers:
 *   post:
 *     summary: Create a new customer
 *     description: Create a new customer record
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, contact_person, email]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Customer company name
 *                 maxLength: 200
 *                 example: "Acme Corporation"
 *               contact_person:
 *                 type: string
 *                 description: Primary contact person
 *                 maxLength: 100
 *                 example: "John Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *                 example: "john@acmecorp.com"
 *               phone:
 *                 type: string
 *                 description: Phone number
 *                 maxLength: 20
 *                 example: "+1-555-123-4567"
 *               shipping_address:
 *                 type: string
 *                 description: Shipping address
 *                 maxLength: 500
 *                 example: "123 Main St, City, State 12345"
 *               billing_address:
 *                 type: string
 *                 description: Billing address
 *                 maxLength: 500
 *                 example: "123 Main St, City, State 12345"
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *                 message:
 *                   type: string
 *                   example: Customer created successfully
 *       400:
 *         description: Validation error or duplicate email
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
 */
export async function POST(request: NextRequest) {
  try {
    const { userDetails } = await getAuthenticatedUser(request)
    const customerData = await validateRequest(request, CreateCustomerSchema)

    // Only salespeople and managers can create customers
    if (!['salesperson', 'manager'].includes(userDetails.role)) {
      throw new ApiError(403, 'Access denied. Only salespeople and managers can create customers.')
    }

    const customer = await CustomerService.createCustomer(
      {
        name: customerData.name,
        contactPerson: customerData.contact_person,
        email: customerData.email,
        phone: customerData.phone,
        shippingAddress: customerData.shipping_address,
        billingAddress: customerData.billing_address,
      },
      userDetails.id
    )

    return createSuccessResponse(customer, 'Customer created successfully', 201)
  } catch (error) {
    return createErrorResponse(error)
  }
}
