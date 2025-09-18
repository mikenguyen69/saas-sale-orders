import { NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services/orderService'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate user
    const user = await auth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has warehouse role
    if (user.role !== 'warehouse') {
      return NextResponse.json(
        {
          error: 'Forbidden. Only warehouse staff can fulfill orders.',
        },
        { status: 403 }
      )
    }

    const orderId = params.id

    // Parse request body for partial fulfillment data
    const body = await request.json().catch(() => ({}))
    const { items } = body // Optional: specific items to fulfill

    // Fulfill the order
    const fulfilledOrder = await orderService.fulfillOrder(orderId, user.id, items)

    return NextResponse.json({
      message: 'Order fulfilled successfully',
      order: fulfilledOrder,
    })
  } catch (error) {
    console.error('Fulfill order error:', error)

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
