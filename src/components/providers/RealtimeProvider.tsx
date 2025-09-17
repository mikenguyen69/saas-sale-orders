'use client'

import React from 'react'
import { useOrderRealtimeUpdates, useProductRealtimeUpdates } from '@/hooks/useRealtimeSubscription'
import { useAuthContext } from './AuthProvider'

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext()

  // Subscribe to order updates for all users
  useOrderRealtimeUpdates()

  // Subscribe to product updates (stock changes, etc.)
  useProductRealtimeUpdates()

  // Only render children if user is available (to avoid unnecessary subscriptions)
  if (!user) {
    return <>{children}</>
  }

  return <>{children}</>
}
