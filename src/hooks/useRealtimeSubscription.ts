'use client'

import { useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useAppStateContext } from '@/components/providers/AppStateProvider'
import type { Database } from '@/types/supabase'

export interface RealtimeSubscriptionOptions {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onEvent?: (payload: any) => void
  enabled?: boolean
}

export function useRealtimeSubscription({
  table,
  event = '*',
  filter,
  onEvent,
  enabled = true,
}: RealtimeSubscriptionOptions) {
  const { user } = useAuthContext()
  const { showInfo } = useAppStateContext()
  const queryClient = useQueryClient()
  const subscriptionRef = useRef<any>(null)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!enabled || !user) {
      return
    }

    // Create subscription
    let subscription = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          ...(filter && { filter }),
        },
        payload => {
          console.log('Realtime event:', payload)

          // Call custom event handler
          onEvent?.(payload)

          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: [table] })

          // Show notification for specific events
          if (table === 'sale_orders' && payload.eventType === 'UPDATE') {
            const oldStatus = payload.old?.status
            const newStatus = payload.new?.status

            if (oldStatus !== newStatus && newStatus) {
              showInfo(
                `Order ${payload.new.customer_name || payload.new.id} status changed to ${newStatus}`
              )
            }
          }

          if (table === 'products' && payload.eventType === 'UPDATE') {
            const oldStock = payload.old?.stock_quantity
            const newStock = payload.new?.stock_quantity

            if (oldStock !== newStock && newStock !== undefined) {
              if (newStock <= 0) {
                showInfo(`Product ${payload.new.name} is now out of stock`)
              } else if (newStock <= 10 && oldStock > 10) {
                showInfo(`Product ${payload.new.name} is running low on stock`)
              }
            }
          }
        }
      )
      .subscribe()

    subscriptionRef.current = subscription

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [enabled, user, table, event, filter, onEvent, supabase, queryClient, showInfo])

  return {
    unsubscribe: () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    },
  }
}

// Specific hooks for common use cases
export function useOrderRealtimeUpdates(orderId?: string) {
  return useRealtimeSubscription({
    table: 'sale_orders',
    filter: orderId ? `id=eq.${orderId}` : undefined,
    enabled: true,
  })
}

export function useProductRealtimeUpdates() {
  return useRealtimeSubscription({
    table: 'products',
    enabled: true,
  })
}
