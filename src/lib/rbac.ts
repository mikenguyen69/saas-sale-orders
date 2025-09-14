import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types'

export function withAuth(
  handler: (req: NextRequest, context: { params?: unknown }) => Promise<NextResponse>,
  allowedRoles?: UserRole[]
) {
  return async (req: NextRequest, context: { params?: unknown }) => {
    const userRole = req.headers.get('x-user-role') as UserRole
    const userId = req.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Add user info to request
    const requestWithUser = new Request(req, {
      headers: {
        ...Object.fromEntries(req.headers.entries()),
        'x-user-id': userId,
        'x-user-role': userRole,
      },
    })

    return handler(requestWithUser as NextRequest, context)
  }
}

export function canAccessOrder(
  userRole: UserRole,
  userId: string,
  order: { salesperson_id: string; status: string }
) {
  switch (userRole) {
    case 'salesperson':
      return order.salesperson_id === userId
    case 'manager':
      return true // Managers can access all orders
    case 'warehouse':
      return ['approved', 'fulfilled'].includes(order.status)
    default:
      return false
  }
}

export function canEditOrder(
  userRole: UserRole,
  userId: string,
  order: { salesperson_id: string; status: string }
) {
  switch (userRole) {
    case 'salesperson':
      return order.salesperson_id === userId && order.status === 'draft'
    case 'manager':
      return order.status === 'submitted'
    case 'warehouse':
      return order.status === 'approved'
    default:
      return false
  }
}
