'use client'

import { AppLayout } from '@/components/layout/AppLayout'
import { Typography, Grid, Card, CardContent, Box, CircularProgress, Alert } from '@mui/material'
import { Receipt, Inventory, People, TrendingUp } from '@mui/icons-material'
import { useDashboardStats, useRecentOrders, useLowStockProducts } from '@/hooks/useDashboard'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders()
  const { data: lowStockProducts, isLoading: productsLoading } = useLowStockProducts()

  const statItems = [
    {
      title: 'Total Orders',
      value: stats ? stats.totalOrders.toString() : '0',
      icon: Receipt,
      color: '#1976d2',
    },
    {
      title: 'Products',
      value: stats ? stats.totalProducts.toString() : '0',
      icon: Inventory,
      color: '#2e7d32',
    },
    {
      title: 'Users',
      value: stats ? stats.totalUsers.toString() : '0',
      icon: People,
      color: '#ed6c02',
    },
    {
      title: 'Revenue',
      value: stats ? `$${stats.totalRevenue.toLocaleString()}` : '$0',
      icon: TrendingUp,
      color: '#9c27b0',
    },
  ]

  if (statsError) {
    return (
      <AppLayout>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load dashboard data. Please try again.
        </Alert>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {statItems.map(stat => {
          const IconComponent = stat.icon
          return (
            <Grid item xs={12} sm={6} md={3} key={stat.title}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: `${stat.color}20`,
                        color: stat.color,
                      }}
                    >
                      <IconComponent />
                    </Box>
                    <Box>
                      <Typography variant="h4" component="div">
                        {statsLoading ? <CircularProgress size={24} /> : stat.value}
                      </Typography>
                      <Typography color="text.secondary">{stat.title}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
        Quick Actions
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              {ordersLoading ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : recentOrders && recentOrders.length > 0 ? (
                <Box>
                  {recentOrders.slice(0, 3).map((order: any) => (
                    <Box key={order.id} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                      <Typography variant="body2" fontWeight="medium">
                        Order #{order.id?.slice(0, 8)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.customer_name} • {order.status}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  No orders found. Create your first order to get started.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Low Stock Products
              </Typography>
              {productsLoading ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : lowStockProducts && lowStockProducts.length > 0 ? (
                <Box>
                  {lowStockProducts.slice(0, 3).map((product: any) => (
                    <Box key={product.id} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                      <Typography variant="body2" fontWeight="medium">
                        {product.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Stock: {product.stock_quantity}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  {stats && stats.lowStockProducts > 0
                    ? `${stats.lowStockProducts} products have low stock`
                    : 'No low stock alerts at the moment.'}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AppLayout>
  )
}
