'use client'

import { useState, useCallback } from 'react'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useAppStateContext } from '@/components/providers/AppStateProvider'

export interface ApiCallOptions {
  showLoading?: boolean
  showErrorNotification?: boolean
  showSuccessNotification?: boolean
  successMessage?: string
  timeoutMs?: number
}

export function useApiCall() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getAccessToken } = useAuthContext()
  const { setLoading: setGlobalLoading, showError, showSuccess } = useAppStateContext()

  const callApi = useCallback(
    async <T>(
      url: string,
      options: RequestInit = {},
      callOptions: ApiCallOptions = {}
    ): Promise<T> => {
      const {
        showLoading = true,
        showErrorNotification = true,
        showSuccessNotification = false,
        successMessage = 'Operation completed successfully',
        timeoutMs = 30000, // 30 second default timeout
      } = callOptions

      try {
        setIsLoading(true)
        setError(null)

        if (showLoading) {
          setGlobalLoading(true)
        }

        const token = getAccessToken()

        // Create AbortController for timeout handling
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
          },
        })

        clearTimeout(timeoutId)

        const data = await response.json()

        if (!response.ok) {
          const errorMessage = data.message || data.error || `HTTP ${response.status}`

          // Handle authentication errors specifically
          if (response.status === 401) {
            // Clear any existing tokens and redirect to login
            if (
              errorMessage.includes('Authorization header with Bearer token required') ||
              errorMessage.includes('Invalid or expired JWT token')
            ) {
              console.warn('Authentication failed, clearing session')
              // This will trigger re-authentication flow
              await fetch('/api/auth/signout', { method: 'POST' })
              window.location.href = '/auth/login'
              return Promise.reject(new Error('Authentication required. Redirecting to login...'))
            }
          }

          throw new Error(errorMessage)
        }

        if (showSuccessNotification) {
          showSuccess(successMessage)
        }

        return data
      } catch (err) {
        let errorMessage = 'An unexpected error occurred'

        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            errorMessage = 'Request timed out. Please check your connection and try again.'
          } else {
            errorMessage = err.message
          }
        }

        setError(errorMessage)

        if (showErrorNotification) {
          showError(errorMessage)
        }

        throw new Error(errorMessage)
      } finally {
        setIsLoading(false)
        if (showLoading) {
          setGlobalLoading(false)
        }
      }
    },
    [getAccessToken, setGlobalLoading, showError, showSuccess]
  )

  return {
    callApi,
    isLoading,
    error,
    clearError: () => setError(null),
  }
}
