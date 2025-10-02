'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Box, Toolbar, Container, LinearProgress } from '@mui/material'
import { AppBar } from './AppBar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

interface AppLayoutProps {
  children: React.ReactNode
  requiredRoles?: string[]
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
  disableGutters?: boolean
}

export function AppLayout({
  children,
  requiredRoles,
  maxWidth = 'lg',
  disableGutters = false,
}: AppLayoutProps) {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    // Show loading indicator when pathname changes
    setIsNavigating(true)
    const timer = setTimeout(() => {
      setIsNavigating(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <ProtectedRoute requiredRoles={requiredRoles}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar />
        {isNavigating && (
          <LinearProgress
            sx={{
              position: 'fixed',
              top: 64,
              left: 0,
              right: 0,
              zIndex: theme => theme.zIndex.drawer + 2,
            }}
          />
        )}
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
          <Container maxWidth={maxWidth} disableGutters={disableGutters}>
            {children}
          </Container>
        </Box>
      </Box>
    </ProtectedRoute>
  )
}
