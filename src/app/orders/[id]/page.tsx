'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, CircularProgress, Box } from '@mui/material'
import { AppLayout } from '@/components/layout/AppLayout'
import { OrderDetails } from '@/components/orders/OrderDetails'
import { OrderActionDialog, type OrderActionType } from '@/components/orders/OrderActionDialog'
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

  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    action: OrderActionType
  }>({ open: false, action: 'approve' })

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

  const handleApprove = () => {
    setActionDialog({ open: true, action: 'approve' })
  }

  const handleReject = () => {
    setActionDialog({ open: true, action: 'reject' })
  }

  const handleConfirmAction = async (notes?: string) => {
    try {
      if (actionDialog.action === 'approve') {
        await approveOrderMutation.mutateAsync({ id: params.id, notes })
      } else {
        await rejectOrderMutation.mutateAsync({ id: params.id, notes })
      }
      setActionDialog({ open: false, action: 'approve' })
    } catch (error) {
      console.error(`Failed to ${actionDialog.action} order:`, error)
    }
  }

  const handleCloseDialog = () => {
    setActionDialog({ open: false, action: 'approve' })
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

  const orderTotal =
    order?.order_items?.reduce((total, item) => total + (item.line_total || 0), 0) || 0

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

      <OrderActionDialog
        open={actionDialog.open}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmAction}
        action={actionDialog.action}
        orderInfo={{
          id: order?.id || params.id,
          customerName: order?.customer_name || 'Unknown Customer',
          total: orderTotal,
        }}
        loading={approveOrderMutation.isPending || rejectOrderMutation.isPending}
      />
    </AppLayout>
  )
}
