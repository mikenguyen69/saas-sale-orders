import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material'
import { Edit, Visibility, CheckCircle, Cancel, LocalShipping } from '@mui/icons-material'
import type { SaleOrder } from '@/types'

interface OrderCardProps {
  order: SaleOrder
  onView?: (order: SaleOrder) => void
  onEdit?: (order: SaleOrder) => void
  onApprove?: (order: SaleOrder) => void
  onReject?: (order: SaleOrder) => void
  onFulfill?: (order: SaleOrder) => void
  showActions?: boolean
  userRole?: string
}

const statusColors = {
  draft: 'default',
  submitted: 'warning',
  approved: 'success',
  fulfilled: 'info',
  rejected: 'error',
} as const

export function OrderCard({
  order,
  onView,
  onEdit,
  onApprove,
  onReject,
  onFulfill,
  showActions = true,
  userRole = 'salesperson',
}: OrderCardProps) {
  const canEdit = order.status === 'draft' && userRole === 'salesperson'
  const canApprove = order.status === 'submitted' && userRole === 'manager'
  const canFulfill = order.status === 'approved' && userRole === 'warehouse'

  const orderTotal =
    order.order_items?.reduce((total, item) => total + (item.line_total || 0), 0) || 0

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1, mr: 1 }}>
            {order.customer_name}
          </Typography>
          {showActions && (
            <Box>
              <Tooltip title="View Details">
                <IconButton size="small" onClick={() => onView?.(order)}>
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
              {canEdit && (
                <Tooltip title="Edit Order">
                  <IconButton size="small" onClick={() => onEdit?.(order)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Contact: {order.contact_person}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Email: {order.email}
        </Typography>

        <Chip
          label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          color={statusColors[order.status]}
          size="small"
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Items
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {order.order_items?.length || 0}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Total
          </Typography>
          <Typography variant="h6" fontWeight="medium" color="primary">
            ${orderTotal.toFixed(2)}
          </Typography>
        </Box>

        {order.delivery_date && (
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant="body2" color="text.secondary">
              Delivery
            </Typography>
            <Typography variant="body2">
              {new Date(order.delivery_date).toLocaleDateString()}
            </Typography>
          </Box>
        )}

        <Typography variant="caption" color="text.secondary">
          Created: {new Date(order.created_at).toLocaleDateString()}
        </Typography>

        {showActions && (canApprove || canFulfill) && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {canApprove && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => onApprove?.(order)}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => onReject?.(order)}
                >
                  Reject
                </Button>
              </>
            )}

            {canFulfill && (
              <Button
                size="small"
                variant="contained"
                startIcon={<LocalShipping />}
                onClick={() => onFulfill?.(order)}
              >
                Fulfill
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
