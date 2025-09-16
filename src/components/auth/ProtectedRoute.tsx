'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { CircularProgress, Box, Typography } from '@mui/material'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      fallback || (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          gap={2}
        >
          <CircularProgress size={40} />
          <Typography color="text.secondary">Loading...</Typography>
        </Box>
      )
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  // TODO: Add role checking when user details are available
  // if (requiredRoles && !requiredRoles.includes(userDetails.role)) {
  //   return <UnauthorizedPage />
  // }

  return <>{children}</>
}
