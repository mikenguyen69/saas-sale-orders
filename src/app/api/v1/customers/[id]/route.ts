import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
  validateRequest,
  ApiError,
} from '@/lib/api-utils'
import { UpdateCustomerSchema } from '@/lib/validations/customer'

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
    const { userDetails, supabase } = await getAuthenticatedUser(request)

    // Only salespeople and managers can access customers
    if (!['salesperson', 'manager'].includes(userDetails.role)) {
      throw new ApiError(403, 'Access denied. Only salespeople and managers can access customers.')
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', params.id)
      .eq('created_by', userDetails.id)
      .is('deleted_at', null)
      .single()

    if (error || !customer) {
      throw new ApiError(404, 'Customer not found')
    }

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
    const { userDetails, supabase } = await getAuthenticatedUser(request)
    const customerData = await validateRequest(request, UpdateCustomerSchema)

    // Only salespeople and managers can update customers
    if (!['salesperson', 'manager'].includes(userDetails.role)) {
      throw new ApiError(403, 'Access denied. Only salespeople and managers can update customers.')
    }

    // Check if customer exists and belongs to user
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', params.id)
      .eq('created_by', userDetails.id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingCustomer) {
      throw new ApiError(404, 'Customer not found')
    }

    // Check for duplicate email if email is being updated
    if (customerData.email && customerData.email !== existingCustomer.email) {
      const { data: duplicateCustomers } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerData.email)
        .is('deleted_at', null)
        .neq('id', params.id)

      if (duplicateCustomers && duplicateCustomers.length > 0) {
        throw new ApiError(400, 'Customer with this email already exists')
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (customerData.name !== undefined) updateData.name = customerData.name
    if (customerData.contact_person !== undefined)
      updateData.contact_person = customerData.contact_person
    if (customerData.email !== undefined) updateData.email = customerData.email
    if (customerData.phone !== undefined) updateData.phone = customerData.phone
    if (customerData.shipping_address !== undefined)
      updateData.shipping_address = customerData.shipping_address
    if (customerData.billing_address !== undefined)
      updateData.billing_address = customerData.billing_address

    // Update the customer
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`)
    }

    return createSuccessResponse(updatedCustomer, 'Customer updated successfully')
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
    const { userDetails, supabase } = await getAuthenticatedUser(request)

    // Only salespeople and managers can delete customers
    if (!['salesperson', 'manager'].includes(userDetails.role)) {
      throw new ApiError(403, 'Access denied. Only salespeople and managers can delete customers.')
    }

    // Check if customer exists and belongs to user
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', params.id)
      .eq('created_by', userDetails.id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingCustomer) {
      throw new ApiError(404, 'Customer not found')
    }

    // Check if customer has any orders
    const { count, error: countError } = await supabase
      .from('sale_orders')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', params.id)
      .is('deleted_at', null)

    if (countError) {
      throw new Error(`Database error: ${countError.message}`)
    }

    if (count && count > 0) {
      throw new ApiError(400, 'Cannot delete customer with existing orders')
    }

    // Soft delete the customer
    const { error: deleteError } = await supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)

    if (deleteError) {
      throw new Error(`Database error: ${deleteError.message}`)
    }

    return createSuccessResponse(null, 'Customer deleted successfully')
  } catch (error) {
    return createErrorResponse(error)
  }
}
