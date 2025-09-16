'use client'

import React from 'react'
import { Box, Toolbar, Container } from '@mui/material'
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
  return (
    <ProtectedRoute requiredRoles={requiredRoles}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar />
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
