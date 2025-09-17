'use client'

import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { OrderForm } from '@/components/orders/OrderForm'
import type { SaleOrder } from '@/types'

export default function NewOrderPage() {
  const router = useRouter()

  const handleSave = (order: SaleOrder) => {
    router.push(`/orders/${order.id}`)
  }

  const handleCancel = () => {
    router.push('/orders')
  }

  return (
    <AppLayout>
      <OrderForm onSave={handleSave} onCancel={handleCancel} />
    </AppLayout>
  )
}
