'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { CircularProgress, Box, Typography } from '@mui/material'

export default function Home() {
  const { user, loading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/auth/login')
      }
    }
  }, [user, loading, router])

  return (
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
}
