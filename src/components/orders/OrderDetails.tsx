'use client'

import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Alert,
} from '@mui/material'
import { Edit, CheckCircle, Cancel, LocalShipping, Print, Download } from '@mui/icons-material'
import type { SaleOrder } from '@/types'

interface OrderDetailsProps {
  order: SaleOrder
  onEdit?: () => void
  onApprove?: () => void
  onReject?: () => void
  onFulfill?: () => void
  userRole?: string
  isLoading?: boolean
}

const statusColors = {
  draft: 'default',
  submitted: 'warning',
  approved: 'success',
  fulfilled: 'info',
  rejected: 'error',
} as const

export function OrderDetails({
  order,
  onEdit,
  onApprove,
  onReject,
  onFulfill,
  userRole = 'salesperson',
  isLoading = false,
}: OrderDetailsProps) {
  const canEdit = order.status === 'draft' && userRole === 'salesperson'
  const canApprove = order.status === 'submitted' && userRole === 'manager'
  const canFulfill = order.status === 'approved' && userRole === 'warehouse'

  const orderTotal =
    order.order_items?.reduce((total, item) => total + (item.line_total || 0), 0) || 0
  const outOfStockItems = order.order_items?.filter(item => !item.is_in_stock) || []

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Order Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Order ID: {order.id}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Print />} disabled={isLoading}>
            Print
          </Button>

          <Button variant="outlined" startIcon={<Download />} disabled={isLoading}>
            Export
          </Button>

          {canEdit && (
            <Button variant="outlined" startIcon={<Edit />} onClick={onEdit} disabled={isLoading}>
              Edit
            </Button>
          )}

          {canApprove && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={onApprove}
                disabled={isLoading}
              >
                Approve
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={onReject}
                disabled={isLoading}
              >
                Reject
              </Button>
            </>
          )}

          {canFulfill && (
            <Button
              variant="contained"
              startIcon={<LocalShipping />}
              onClick={onFulfill}
              disabled={isLoading}
            >
              Fulfill
            </Button>
          )}
        </Box>
      </Box>

      {/* Status and Alerts */}
      <Box sx={{ mb: 3 }}>
        <Chip
          label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          color={statusColors[order.status]}
          sx={{ mb: 2 }}
        />

        {outOfStockItems.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {outOfStockItems.length} item(s) are out of stock and may delay fulfillment.
          </Alert>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Customer Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Customer Name
                </Typography>
                <Typography variant="body1">{order.customer_name}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Contact Person
                </Typography>
                <Typography variant="body1">{order.contact_person}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{order.email}</Typography>
              </Box>

              {order.shipping_address && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Shipping Address
                  </Typography>
                  <Typography variant="body1">{order.shipping_address}</Typography>
                </Box>
              )}

              {order.delivery_date && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Delivery Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(order.delivery_date).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Order Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Information
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {new Date(order.created_at).toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {new Date(order.updated_at).toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Items Count
                </Typography>
                <Typography variant="body1">{order.order_items?.length || 0}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  ${orderTotal.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Items */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>

              {!order.order_items || order.order_items.length === 0 ? (
                <Alert severity="info">No items in this order.</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Code</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Stock Status</TableCell>
                        <TableCell align="center">Line Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.order_items.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {item.product?.name || 'Unknown Product'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {item.product?.code || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">${item.unit_price.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="medium">
                              ${item.line_total.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={item.is_in_stock ? 'In Stock' : 'Out of Stock'}
                              color={item.is_in_stock ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                item.line_status.charAt(0).toUpperCase() + item.line_status.slice(1)
                              }
                              color={
                                item.line_status === 'fulfilled'
                                  ? 'success'
                                  : item.line_status === 'backordered'
                                    ? 'warning'
                                    : 'default'
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Typography variant="h6" align="right">
                            Total:
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="h6" align="right" color="primary" fontWeight="bold">
                            ${orderTotal.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell />
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Notes */}
        {order.notes && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {order.notes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
