import { prisma } from '@/lib/prisma'
import { OrderStatus, UserRole } from '@/types'
import { ORDER_WORKFLOW } from '@/utils/constants'

export class OrderService {
  static async createOrder(data: Record<string, unknown>, userId: string) {
    return prisma.saleOrder.create({
      data: {
        customerId: data.customerId as string | null,
        customerName: data.customerName as string,
        contactPerson: data.contactPerson as string,
        email: data.email as string,
        shippingAddress: data.shippingAddress as string | null,
        deliveryDate: data.deliveryDate as Date | null,
        notes: (data.notes as string) || '',
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
        customer: true,
      },
    })
  }

  static async updateOrder(id: string, data: Record<string, unknown>, _userId: string) {
    const updateData: Record<string, unknown> = {}
    if (data.customerId !== undefined) updateData.customerId = data.customerId as string | null
    if (data.customerName) updateData.customerName = data.customerName as string
    if (data.contactPerson) updateData.contactPerson = data.contactPerson as string
    if (data.email) updateData.email = data.email as string
    if (data.shippingAddress !== undefined)
      updateData.shippingAddress = data.shippingAddress as string | null
    if (data.deliveryDate !== undefined) updateData.deliveryDate = data.deliveryDate as Date | null
    if (data.notes !== undefined) updateData.notes = data.notes as string

    return prisma.saleOrder.update({
      where: { id },
      data: updateData,
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        salesperson: true,
        manager: true,
        warehouseStaff: true,
        customer: true,
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
      if (order.status !== 'delivered') throw new Error('Only delivered orders can be fulfilled')

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
          previousStatus: 'delivered',
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

  static async startPackingOrder(id: string, userId: string, userRole: UserRole) {
    if (userRole !== 'warehouse') throw new Error('Only warehouse staff can start packing orders')

    const order = await prisma.saleOrder.findUnique({ where: { id } })
    if (!order) throw new Error('Order not found')
    if (order.status !== 'approved') throw new Error('Only approved orders can be moved to packing')

    const updatedOrder = await prisma.saleOrder.update({
      where: { id },
      data: {
        status: 'packing',
        warehouseId: userId,
      },
    })

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        previousStatus: 'approved',
        newStatus: 'packing',
        changedBy: userId,
      },
    })

    return updatedOrder
  }

  static async markOrderPacked(id: string, userId: string, userRole: UserRole) {
    if (userRole !== 'warehouse') throw new Error('Only warehouse staff can mark orders as packed')

    const order = await prisma.saleOrder.findUnique({ where: { id } })
    if (!order) throw new Error('Order not found')
    if (order.status !== 'packing') throw new Error('Only packing orders can be marked as packed')

    const updatedOrder = await prisma.saleOrder.update({
      where: { id },
      data: {
        status: 'packed',
      },
    })

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        previousStatus: 'packing',
        newStatus: 'packed',
        changedBy: userId,
      },
    })

    return updatedOrder
  }

  static async markOrderShipped(id: string, userId: string, userRole: UserRole) {
    if (userRole !== 'warehouse') throw new Error('Only warehouse staff can mark orders as shipped')

    const order = await prisma.saleOrder.findUnique({ where: { id } })
    if (!order) throw new Error('Order not found')
    if (order.status !== 'packed') throw new Error('Only packed orders can be marked as shipped')

    const updatedOrder = await prisma.saleOrder.update({
      where: { id },
      data: {
        status: 'shipped',
      },
    })

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        previousStatus: 'packed',
        newStatus: 'shipped',
        changedBy: userId,
      },
    })

    return updatedOrder
  }

  static async markOrderDelivered(id: string, userId: string, userRole: UserRole) {
    if (userRole !== 'warehouse')
      throw new Error('Only warehouse staff can mark orders as delivered')

    const order = await prisma.saleOrder.findUnique({ where: { id } })
    if (!order) throw new Error('Order not found')
    if (order.status !== 'shipped')
      throw new Error('Only shipped orders can be marked as delivered')

    const updatedOrder = await prisma.saleOrder.update({
      where: { id },
      data: {
        status: 'delivered',
      },
    })

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        previousStatus: 'shipped',
        newStatus: 'delivered',
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
    const workflow = ORDER_WORKFLOW[currentStatus as keyof typeof ORDER_WORKFLOW]
    if (!workflow) return false

    const canTransition = workflow.canTransitionTo.some(status => status === targetStatus)
    const roleAllowed = workflow.allowedRoles.some(role => role === userRole)

    return canTransition && roleAllowed
  }
}
