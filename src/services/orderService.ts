import { prisma } from '@/lib/prisma'
import { OrderStatus, UserRole, SaleOrder } from '@/types'
import { ORDER_WORKFLOW } from '@/utils/constants'

export class OrderService {
  static async createOrder(data: Partial<SaleOrder>, userId: string) {
    return prisma.saleOrder.create({
      data: {
        ...data,
        salespersonId: userId,
        status: 'draft',
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        salesperson: true,
      },
    })
  }

  static async updateOrder(id: string, data: Partial<SaleOrder>, _userId: string) {
    return prisma.saleOrder.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        salesperson: true,
        manager: true,
        warehouseStaff: true,
      },
    })
  }

  static async submitOrder(id: string, userId: string) {
    const order = await prisma.saleOrder.findUnique({
      where: { id },
      include: { orderItems: { include: { product: true } } },
    })

    if (!order) throw new Error('Order not found')
    if (order.status !== 'draft') throw new Error('Only draft orders can be submitted')
    if (order.salespersonId !== userId) throw new Error('Unauthorized')

    // Validate stock availability
    await Promise.all(
      order.orderItems.map(
        async (item: { id: string; product: { stockQuantity: number }; quantity: number }) => {
          const product = item.product
          const isInStock = product.stockQuantity >= item.quantity

          return prisma.orderItem.update({
            where: { id: item.id },
            data: { isInStock },
          })
        }
      )
    )

    // Update order status
    const updatedOrder = await prisma.saleOrder.update({
      where: { id },
      data: { status: 'submitted' },
    })

    // Log status change
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        previousStatus: 'draft',
        newStatus: 'submitted',
        changedBy: userId,
      },
    })

    return updatedOrder
  }

  static async approveOrder(id: string, userId: string, userRole: UserRole) {
    if (userRole !== 'manager') throw new Error('Only managers can approve orders')

    const order = await prisma.saleOrder.findUnique({
      where: { id },
      include: { orderItems: { include: { product: true } } },
    })

    if (!order) throw new Error('Order not found')
    if (order.status !== 'submitted') throw new Error('Only submitted orders can be approved')

    // Re-validate stock on approval
    await Promise.all(
      order.orderItems.map(
        async (item: { id: string; product: { stockQuantity: number }; quantity: number }) => {
          const product = item.product
          const isInStock = product.stockQuantity >= item.quantity

          return prisma.orderItem.update({
            where: { id: item.id },
            data: { isInStock },
          })
        }
      )
    )

    const updatedOrder = await prisma.saleOrder.update({
      where: { id },
      data: {
        status: 'approved',
        managerId: userId,
      },
    })

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        previousStatus: 'submitted',
        newStatus: 'approved',
        changedBy: userId,
      },
    })

    return updatedOrder
  }

  static async fulfillOrder(id: string, userId: string, userRole: UserRole) {
    if (userRole !== 'warehouse') throw new Error('Only warehouse staff can fulfill orders')

    return prisma.$transaction(async tx => {
      const order = await tx.saleOrder.findUnique({
        where: { id },
        include: { orderItems: { include: { product: true } } },
      })

      if (!order) throw new Error('Order not found')
      if (order.status !== 'approved') throw new Error('Only approved orders can be fulfilled')

      // Deduct stock quantities
      for (const item of order.orderItems) {
        if (item.isInStock) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          })

          await tx.orderItem.update({
            where: { id: item.id },
            data: { lineStatus: 'fulfilled' },
          })
        }
      }

      const updatedOrder = await tx.saleOrder.update({
        where: { id },
        data: {
          status: 'fulfilled',
          warehouseId: userId,
        },
      })

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          previousStatus: 'approved',
          newStatus: 'fulfilled',
          changedBy: userId,
        },
      })

      return updatedOrder
    })
  }

  static async rejectOrder(id: string, userId: string, userRole: UserRole) {
    if (userRole !== 'manager') throw new Error('Only managers can reject orders')

    const order = await prisma.saleOrder.findUnique({ where: { id } })
    if (!order) throw new Error('Order not found')
    if (order.status !== 'submitted') throw new Error('Only submitted orders can be rejected')

    const updatedOrder = await prisma.saleOrder.update({
      where: { id },
      data: {
        status: 'rejected',
        managerId: userId,
      },
    })

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        previousStatus: 'submitted',
        newStatus: 'rejected',
        changedBy: userId,
      },
    })

    return updatedOrder
  }

  static canTransitionToStatus(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    userRole: UserRole
  ) {
    const workflow = ORDER_WORKFLOW[currentStatus]
    return (
      workflow.canTransitionTo.includes(targetStatus) && workflow.allowedRoles.includes(userRole)
    )
  }
}
