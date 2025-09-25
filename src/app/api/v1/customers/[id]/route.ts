import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
  validateRequest,
  ApiError,
} from '@/lib/api-utils'
import { UpdateCustomerSchema } from '@/lib/validations/customer'
import { CustomerService } from '@/services/customerService'

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     description: Retrieve a specific customer by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
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
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userDetails } = await getAuthenticatedUser(request)

    // Only salespeople and managers can access customers
    if (!['salesperson', 'manager'].includes(userDetails.role)) {
      throw new ApiError(403, 'Access denied. Only salespeople and managers can access customers.')
    }

    const customer = await CustomerService.getCustomer(params.id, userDetails.id)

    return createSuccessResponse(customer)
  } catch (error) {
    return createErrorResponse(error)
  }
}

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   put:
 *     summary: Update customer
 *     description: Update an existing customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *       200:
 *         description: Customer updated successfully
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
 *                   example: Customer updated successfully
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
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userDetails } = await getAuthenticatedUser(request)
    const customerData = await validateRequest(request, UpdateCustomerSchema)

    // Only salespeople and managers can update customers
    if (!['salesperson', 'manager'].includes(userDetails.role)) {
      throw new ApiError(403, 'Access denied. Only salespeople and managers can update customers.')
    }

    const customer = await CustomerService.updateCustomer(
      params.id,
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

    return createSuccessResponse(customer, 'Customer updated successfully')
  } catch (error) {
    return createErrorResponse(error)
  }
}

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     description: Soft delete a customer (only if no orders exist)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
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
 *                   example: Customer deleted successfully
 *       400:
 *         description: Cannot delete customer with existing orders
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
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userDetails } = await getAuthenticatedUser(request)

    // Only salespeople and managers can delete customers
    if (!['salesperson', 'manager'].includes(userDetails.role)) {
      throw new ApiError(403, 'Access denied. Only salespeople and managers can delete customers.')
    }

    await CustomerService.deleteCustomer(params.id, userDetails.id)

    return createSuccessResponse(null, 'Customer deleted successfully')
  } catch (error) {
    return createErrorResponse(error)
  }
}
