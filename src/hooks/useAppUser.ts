'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useApiCall } from './useApiCall'
import type { UserRole } from '@/types'

export interface AppUser {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export function useAppUser() {
  const { user: authUser, session } = useAuthContext()
  const { callApi } = useApiCall()

  return useQuery({
    queryKey: ['app-user', authUser?.id],
    queryFn: async (): Promise<AppUser> => {
      if (!authUser?.id) {
        throw new Error('No authenticated user')
      }

      const response = await callApi<{ success: boolean; data: AppUser }>(
        `/api/v1/users/${authUser.id}`,
        {},
        { showLoading: false }
      )

      return response.data
    },
    enabled: !!authUser?.id && !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5 minutes - user data doesn't change often
    retry: 3,
  })
}
