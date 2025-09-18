import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate user and require warehouse role
    const user = await requireAuth(['warehouse'])

    const orderId = params.id

    // Parse request body for partial fulfillment data
    const body = await request.json().catch(() => ({}))
    const { items } = body // Optional: specific items to fulfill

    // Update order status to fulfilled
    const updatedOrder = await prisma.saleOrder.update({
      where: { id: orderId },
      data: {
        status: 'fulfilled',
        warehouseId: user.id,
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
      },
    })

    // Update order items to fulfilled if specific items provided
    if (items && Array.isArray(items)) {
      await prisma.orderItem.updateMany({
        where: {
          orderId: orderId,
          id: { in: items },
        },
        data: {
          lineStatus: 'fulfilled',
        },
      })
    } else {
      // Fulfill all items
      await prisma.orderItem.updateMany({
        where: { orderId: orderId },
        data: {
          lineStatus: 'fulfilled',
        },
      })
    }

    // Add to status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: orderId,
        previousStatus: 'approved',
        newStatus: 'fulfilled',
        changedBy: user.id,
      },
    })

    return NextResponse.json({
      message: 'Order fulfilled successfully',
      order: updatedOrder,
    })
  } catch (error) {
    console.error('Fulfill order error:', error)

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
