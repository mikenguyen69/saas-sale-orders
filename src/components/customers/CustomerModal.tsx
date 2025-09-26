'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { Customer } from '@/types'
import { CustomerForm } from './CustomerForm'

interface CustomerModalProps {
  customer?: Customer
  open: boolean
  onClose: () => void
  onSave: (customer: Customer) => void
  onSaveAndSelect?: (customer: Customer) => void
  mode?: 'create' | 'edit'
}

export function CustomerModal({
  customer,
  open,
  onClose,
  onSave,
  onSaveAndSelect,
  mode = 'create',
}: CustomerModalProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))

  const handleSave = (savedCustomer: Customer) => {
    onSave(savedCustomer)
    onClose()
  }

  const handleSaveAndSelect = (savedCustomer: Customer) => {
    if (onSaveAndSelect) {
      onSaveAndSelect(savedCustomer)
    }
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          minHeight: fullScreen ? '100vh' : '600px',
          maxHeight: fullScreen ? '100vh' : '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        {mode === 'edit' ? 'Edit Customer' : 'New Customer'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: theme => theme.palette.grey[500],
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: fullScreen ? 'calc(100vh - 120px)' : 'auto',
          }}
        >
          <CustomerForm
            customer={customer}
            onSave={handleSave}
            onSaveAndSelect={handleSaveAndSelect}
            onCancel={onClose}
            mode={mode}
          />
        </Box>
      </DialogContent>
    </Dialog>
  )
}
