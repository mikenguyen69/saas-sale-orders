import { NextRequest } from 'next/server'
import { createErrorResponse, createSuccessResponse, getAuthenticatedUser } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await getAuthenticatedUser(request)

    // Get total orders count
    const { count: totalOrders } = await supabase
      .from('sale_orders')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)

    // Get total products count
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)

    // Get orders with their items to calculate revenue
    const { data: ordersWithItems } = await supabase
      .from('sale_orders')
      .select(
        `
        *,
        order_items(line_total)
      `
      )
      .in('status', ['approved', 'fulfilled'])
      .is('deleted_at', null)

    // Calculate total revenue
    const totalRevenue =
      ordersWithItems?.reduce((total, order) => {
        const orderTotal =
          order.order_items?.reduce((sum: number, item: any) => sum + (item.line_total || 0), 0) ||
          0
        return total + orderTotal
      }, 0) || 0

    // Get pending orders (submitted but not approved)
    const { count: pendingOrders } = await supabase
      .from('sale_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted')
      .is('deleted_at', null)

    // Get low stock products (stock <= 10)
    const { count: lowStockProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lte('stock_quantity', 10)
      .gt('stock_quantity', 0)
      .is('deleted_at', null)

    // Get recent orders count (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: recentOrdersCount } = await supabase
      .from('sale_orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())
      .is('deleted_at', null)

    // Get orders by status
    const { data: statusCounts } = await supabase
      .from('sale_orders')
      .select('status')
      .is('deleted_at', null)

    const ordersByStatus = statusCounts?.reduce(
      (acc: any, order) => {
        if (order.status) {
          acc[order.status] = (acc[order.status] || 0) + 1
        }
        return acc
      },
      {
        draft: 0,
        submitted: 0,
        approved: 0,
        fulfilled: 0,
        rejected: 0,
      }
    ) || {
      draft: 0,
      submitted: 0,
      approved: 0,
      fulfilled: 0,
      rejected: 0,
    }

    const stats = {
      totalOrders: totalOrders || 0,
      totalProducts: totalProducts || 0,
      totalUsers: totalUsers || 0,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      pendingOrders: pendingOrders || 0,
      lowStockProducts: lowStockProducts || 0,
      recentOrdersCount: recentOrdersCount || 0,
      ordersByStatus,
    }

    return createSuccessResponse(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return createErrorResponse(error)
  }
}
