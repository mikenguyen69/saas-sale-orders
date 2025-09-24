'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Alert, CircularProgress, Box } from '@mui/material'
import { AppLayout } from '@/components/layout/AppLayout'
import { OrderDetails } from '@/components/orders/OrderDetails'
import { useOrder, useApproveOrder, useRejectOrder, useFulfillOrder } from '@/hooks/useOrders'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { useAppUser } from '@/hooks/useAppUser'

interface OrderDetailsPageProps {
  params: {
    id: string
  }
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const router = useRouter()
  const { data: order, isLoading, error } = useOrder(params.id)
  const { data: appUser, isLoading: userLoading } = useAppUser()

  const approveOrderMutation = useApproveOrder()
  const rejectOrderMutation = useRejectOrder()
  const fulfillOrderMutation = useFulfillOrder()

  // Subscribe to real-time updates for this specific order
  useRealtimeSubscription({
    table: 'sale_orders',
    filter: `id=eq.${params.id}`,
    enabled: !!params.id,
  })

  const handleEdit = () => {
    router.push(`/orders/${params.id}/edit`)
  }

  const handleApprove = async () => {
    try {
      await approveOrderMutation.mutateAsync(params.id)
    } catch (error) {
      console.error('Failed to approve order:', error)
    }
  }

  const handleReject = async () => {
    try {
      await rejectOrderMutation.mutateAsync(params.id)
    } catch (error) {
      console.error('Failed to reject order:', error)
    }
  }

  const handleFulfill = async () => {
    try {
      await fulfillOrderMutation.mutateAsync(params.id)
    } catch (error) {
      console.error('Failed to fulfill order:', error)
    }
  }

  if (isLoading || userLoading) {
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

  const isProcessing =
    approveOrderMutation.isPending ||
    rejectOrderMutation.isPending ||
    fulfillOrderMutation.isPending

  return (
    <AppLayout>
      <OrderDetails
        order={order}
        onEdit={handleEdit}
        onApprove={handleApprove}
        onReject={handleReject}
        onFulfill={handleFulfill}
        userRole={appUser?.role || 'salesperson'}
        isLoading={isProcessing}
      />
    </AppLayout>
  )
}
