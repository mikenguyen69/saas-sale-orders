'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Alert, CircularProgress, Box } from '@mui/material'
import { AppLayout } from '@/components/layout/AppLayout'
import { OrderForm } from '@/components/orders/OrderForm'
import { useOrder } from '@/hooks/useOrders'
import type { SaleOrder } from '@/types'

interface EditOrderPageProps {
  params: {
    id: string
  }
}

export default function EditOrderPage({ params }: EditOrderPageProps) {
  const router = useRouter()
  const { data: order, isLoading, error } = useOrder(params.id)

  const handleSave = (updatedOrder: SaleOrder) => {
    router.push(`/orders/${updatedOrder.id}`)
  }

  const handleCancel = () => {
    router.push(`/orders/${params.id}`)
  }

  if (isLoading) {
    return (
      <AppLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </AppLayout>
    )
  }

  if (error || !order) {
    return (
      <AppLayout>
        <Alert severity="error">Failed to load order details. Please try again.</Alert>
      </AppLayout>
    )
  }

  if (order.status !== 'draft') {
    return (
      <AppLayout>
        <Alert severity="warning">
          This order can no longer be edited because it has been submitted.
        </Alert>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <OrderForm order={order} onSave={handleSave} onCancel={handleCancel} />
    </AppLayout>
  )
}
