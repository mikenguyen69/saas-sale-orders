import React from 'react'
import { Skeleton, Card, CardContent, Grid, Box } from '@mui/material'

export function DashboardStatSkeleton() {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 1 }} />
          <Box flex={1}>
            <Skeleton variant="text" width={80} height={40} />
            <Skeleton variant="text" width={100} height={20} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export function DashboardStatsSkeleton() {
  return (
    <Grid container spacing={3}>
      {[1, 2, 3, 4].map(i => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <DashboardStatSkeleton />
        </Grid>
      ))}
    </Grid>
  )
}

export function OrderCardSkeleton() {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton variant="text" width={120} height={24} />
          <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
        </Box>
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="40%" height={20} />
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
        </Box>
      </CardContent>
    </Card>
  )
}

export function OrderListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Box>
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </Box>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width={80} height={24} />
          <Skeleton variant="rectangular" width={60} height={24} />
        </Box>
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width={100} height={20} />
          <Skeleton variant="text" width={80} height={20} />
        </Box>
      </CardContent>
    </Card>
  )
}

export function ProductListSkeleton({ count = 12 }: { count?: number }) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          <ProductCardSkeleton />
        </Grid>
      ))}
    </Grid>
  )
}

export function DataTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Box sx={{ width: '100%' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            gap: 2,
            py: 2,
            borderBottom: '1px solid #eee',
          }}
        >
          <Skeleton variant="text" width="15%" height={20} />
          <Skeleton variant="text" width="25%" height={20} />
          <Skeleton variant="text" width="20%" height={20} />
          <Skeleton variant="rectangular" width="15%" height={24} sx={{ borderRadius: 1 }} />
          <Skeleton variant="text" width="15%" height={20} />
          <Skeleton variant="text" width="10%" height={20} />
        </Box>
      ))}
    </Box>
  )
}

export function ListItemSkeleton() {
  return (
    <Box sx={{ py: 1, borderBottom: '1px solid #eee' }}>
      <Skeleton variant="text" width="70%" height={20} />
      <Skeleton variant="text" width="40%" height={16} />
    </Box>
  )
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Box>
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </Box>
  )
}
