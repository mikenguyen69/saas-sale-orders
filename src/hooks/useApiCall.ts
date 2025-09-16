'use client'

import { useState, useCallback } from 'react'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useAppStateContext } from '@/components/providers/AppStateProvider'

export interface ApiCallOptions {
  showLoading?: boolean
  showErrorNotification?: boolean
  showSuccessNotification?: boolean
  successMessage?: string
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
      } = callOptions

      try {
        setIsLoading(true)
        setError(null)

        if (showLoading) {
          setGlobalLoading(true)
        }

        const token = getAccessToken()
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
          },
        })

        const data = await response.json()

        if (!response.ok) {
          const errorMessage = data.message || data.error || `HTTP ${response.status}`
          throw new Error(errorMessage)
        }

        if (showSuccessNotification) {
          showSuccess(successMessage)
        }

        return data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(errorMessage)

        if (showErrorNotification) {
          showError(errorMessage)
        }

        throw err
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
