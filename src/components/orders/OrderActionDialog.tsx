'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
} from '@mui/material'
import { CheckCircle, Cancel } from '@mui/icons-material'

export type OrderActionType = 'approve' | 'reject'

interface OrderActionDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (notes?: string) => void
  action: OrderActionType
  orderInfo: {
    id: string
    customerName: string
    total: number
  }
  loading?: boolean
}

export function OrderActionDialog({
  open,
  onClose,
  onConfirm,
  action,
  orderInfo,
  loading = false,
}: OrderActionDialogProps) {
  const [notes, setNotes] = useState('')

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined)
    setNotes('') // Clear notes for next time
  }

  const handleClose = () => {
    setNotes('')
    onClose()
  }

  const isApproval = action === 'approve'
  const actionText = isApproval ? 'Approve' : 'Reject'
  const actionColor = isApproval ? 'success' : 'error'
  const ActionIcon = isApproval ? CheckCircle : Cancel

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ActionIcon color={actionColor} />
          {actionText} Order
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to {action} this order?
        </Typography>

        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Order ID: {orderInfo.id.slice(0, 8)}...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customer: {orderInfo.customerName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total: ${orderInfo.total.toFixed(2)}
          </Typography>
        </Box>

        <TextField
          label={`Notes ${isApproval ? '(Optional)' : '(Reason for rejection)'}`}
          placeholder={
            isApproval ? 'Add any approval notes...' : 'Please provide a reason for rejection...'
          }
          multiline
          rows={3}
          fullWidth
          value={notes}
          onChange={e => setNotes(e.target.value)}
          inputProps={{ maxLength: 1000 }}
          helperText={`${notes.length}/1000 characters`}
          sx={{ mt: 2 }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={actionColor}
          startIcon={<ActionIcon />}
          disabled={loading}
        >
          {loading ? `${actionText}ing...` : actionText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
