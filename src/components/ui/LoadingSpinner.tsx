import React from 'react'
import { CircularProgress, Box, Typography } from '@mui/material'

interface LoadingSpinnerProps {
  size?: number
  message?: string
  fullScreen?: boolean
  color?: 'primary' | 'secondary' | 'inherit'
}

export function LoadingSpinner({
  size = 40,
  message,
  fullScreen = false,
  color = 'primary',
}: LoadingSpinnerProps) {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        ...(fullScreen && {
          minHeight: '100vh',
          width: '100%',
        }),
      }}
    >
      <CircularProgress size={size} color={color} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  )

  return content
}
