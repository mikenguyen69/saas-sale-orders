'use client'

import React from 'react'
import { Snackbar, Alert, Slide, SlideProps } from '@mui/material'
import { useAppStateContext } from '@/components/providers/AppStateProvider'

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />
}

export function NotificationProvider() {
  const { notifications, removeNotification } = useAppStateContext()
  const currentNotification = notifications[0] // Show one at a time

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }
    if (currentNotification) {
      removeNotification(currentNotification.id)
    }
  }

  return (
    <Snackbar
      open={!!currentNotification}
      autoHideDuration={currentNotification?.autoHide !== false ? 5000 : null}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      {currentNotification && (
        <Alert
          onClose={handleClose}
          severity={currentNotification.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {currentNotification.message}
        </Alert>
      )}
    </Snackbar>
  )
}
