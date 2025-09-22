'use client'

import { useState, useCallback } from 'react'

export interface AppState {
  isLoading: boolean
  error: string | null
  notifications: Notification[]
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  autoHide?: boolean
}

export function useAppState() {
  const [state, setState] = useState<AppState>({
    isLoading: false,
    error: null,
    notifications: [],
  })

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const removeNotification = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
    }))
  }, [])

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      const newNotification: Notification = { ...notification, id }

      setState(prev => ({
        ...prev,
        notifications: [...prev.notifications, newNotification],
      }))

      // Auto-remove notification if autoHide is true
      if (notification.autoHide !== false) {
        setTimeout(() => {
          removeNotification(id)
        }, 5000)
      }

      return id
    },
    [removeNotification]
  )

  const clearAllNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }))
  }, [])

  const showSuccess = useCallback(
    (message: string) => {
      return addNotification({ type: 'success', message })
    },
    [addNotification]
  )

  const showError = useCallback(
    (message: string) => {
      return addNotification({ type: 'error', message, autoHide: false })
    },
    [addNotification]
  )

  const showWarning = useCallback(
    (message: string) => {
      return addNotification({ type: 'warning', message })
    },
    [addNotification]
  )

  const showInfo = useCallback(
    (message: string) => {
      return addNotification({ type: 'info', message })
    },
    [addNotification]
  )

  return {
    ...state,
    setLoading,
    setError,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}
