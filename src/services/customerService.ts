import { prisma, withDatabaseErrorHandling } from '@/lib/prisma'

export interface CreateCustomerData {
  name: string
  contactPerson: string
  email: string
  phone?: string
  shippingAddress?: string
  billingAddress?: string
}

export interface UpdateCustomerData {
  name?: string
  contactPerson?: string
  email?: string
  phone?: string
  shippingAddress?: string
  billingAddress?: string
}

export interface CustomerQueryOptions {
  search?: string
  page?: number
  limit?: number
}

export class CustomerService {
  static async createCustomer(data: CreateCustomerData, createdBy: string) {
    // Check for duplicate email within the same tenant (user)
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email: data.email,
        createdBy,
        deletedAt: null,
      },
    })

    if (existingCustomer) {
      throw new Error('Customer with this email already exists')
    }

    return prisma.customer.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        createdBy,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            saleOrders: true,
          },
        },
      },
    })
  }

  static async getCustomer(id: string, userId: string) {
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        createdBy: userId,
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            saleOrders: true,
          },
        },
      },
    })

    if (!customer) {
      throw new Error('Customer not found')
    }

    return customer
  }

  static async updateCustomer(id: string, data: UpdateCustomerData, userId: string) {
    // Check if customer exists and belongs to user
    const existingCustomer = await CustomerService.getCustomer(id, userId)

    // Check for duplicate email if email is being updated
    if (data.email && data.email !== existingCustomer.email) {
      const duplicateCustomer = await prisma.customer.findFirst({
        where: {
          email: data.email,
          createdBy: userId,
          deletedAt: null,
          NOT: {
            id,
          },
        },
      })

      if (duplicateCustomer) {
        throw new Error('Customer with this email already exists')
      }
    }

    return prisma.customer.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.contactPerson && { contactPerson: data.contactPerson }),
        ...(data.email && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.shippingAddress !== undefined && { shippingAddress: data.shippingAddress }),
        ...(data.billingAddress !== undefined && { billingAddress: data.billingAddress }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            saleOrders: true,
          },
        },
      },
    })
  }

  static async deleteCustomer(id: string, userId: string) {
    // Check if customer exists and belongs to user
    await CustomerService.getCustomer(id, userId)

    // Check if customer has any orders
    const orderCount = await prisma.saleOrder.count({
      where: {
        customerId: id,
        deletedAt: null,
      },
    })

    if (orderCount > 0) {
      throw new Error('Cannot delete customer with existing orders')
    }

    return prisma.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })
  }

  static async listCustomers(userId: string, options: CustomerQueryOptions = {}) {
    return withDatabaseErrorHandling(async () => {
      const { search, page = 1, limit = 20 } = options
      const offset = (page - 1) * limit

      const whereClause = {
        createdBy: userId,
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { contactPerson: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      }

      const [customers, totalCount] = await Promise.all([
        prisma.customer.findMany({
          where: whereClause,
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                saleOrders: true,
              },
            },
          },
          orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
          skip: offset,
          take: limit,
        }),
        prisma.customer.count({ where: whereClause }),
      ])

      const totalPages = Math.ceil(totalCount / limit)

      return {
        customers,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      }
    })
  }

  static async searchCustomers(query: string, userId: string) {
    return withDatabaseErrorHandling(async () => {
      return prisma.customer.findMany({
        where: {
          createdBy: userId,
          deletedAt: null,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { contactPerson: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          contactPerson: true,
        },
        orderBy: { name: 'asc' },
        take: 10, // Limit search results for performance
      })
    })
  }
}
