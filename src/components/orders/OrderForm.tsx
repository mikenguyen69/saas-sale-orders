'use client'

import React, { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Grid,
  Button,
  Typography,
  Alert,
  Divider,
  Chip,
} from '@mui/material'
import { Save, Send, AttachFile } from '@mui/icons-material'
import { DataGrid, GridColDef, GridRowModel, GridActionsCellItem } from '@mui/x-data-grid'
import { Delete, Add } from '@mui/icons-material'
import { FileUpload } from '@/components/ui/FileUpload'
import { useCreateOrder, useUpdateOrder, useSubmitOrder } from '@/hooks/useOrders'
import { ProductSelector } from './ProductSelector'
import type { SaleOrder, OrderItem, Product } from '@/types'

const orderSchema = yup.object({
  customer_name: yup.string().required('Customer name is required'),
  contact_person: yup.string().required('Contact person is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  shipping_address: yup.string(),
  delivery_date: yup.string(),
  notes: yup.string(),
})

type OrderFormData = yup.InferType<typeof orderSchema>

interface OrderItemRow extends Omit<OrderItem, 'id' | 'order_id'> {
  tempId: string
  product?: Product
}

interface OrderFormProps {
  order?: SaleOrder
  onSave?: (order: SaleOrder) => void
  onCancel?: () => void
}

export function OrderForm({ order, onSave, onCancel }: OrderFormProps) {
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>(() => {
    // Handle both 'order_items' and 'items' properties for compatibility
    const items = order?.order_items || (order as any)?.items
    if (items && Array.isArray(items)) {
      return items.map(item => ({
        ...item,
        tempId: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      }))
    }
    return []
  })
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>(
    order?.attachments?.map(attachment => attachment.file_url) || []
  )

  const createOrderMutation = useCreateOrder()
  const updateOrderMutation = useUpdateOrder()
  const submitOrderMutation = useSubmitOrder()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OrderFormData>({
    resolver: yupResolver(orderSchema),
    defaultValues: order
      ? {
          customer_name: order.customer_name,
          contact_person: order.contact_person,
          email: order.email,
          shipping_address: order.shipping_address || '',
          delivery_date: order.delivery_date || '',
          notes: order.notes || '',
        }
      : undefined,
  })

  const calculateTotal = useCallback(() => {
    return orderItems.reduce((total, item) => total + (item.line_total || 0), 0)
  }, [orderItems])

  const handleAddProduct = (product: Product) => {
    const existingItemIndex = orderItems.findIndex(item => item.product_id === product.id)

    if (existingItemIndex >= 0) {
      // Increase quantity if product already exists
      const updatedItems = [...orderItems]
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + 1,
        line_total:
          (updatedItems[existingItemIndex].quantity + 1) *
          updatedItems[existingItemIndex].unit_price,
      }
      setOrderItems(updatedItems)
    } else {
      // Add new item
      const newItem: OrderItemRow = {
        tempId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        product_id: product.id,
        quantity: 1,
        unit_price: product.retail_price,
        line_total: product.retail_price,
        is_in_stock: product.stock_quantity > 0,
        line_status: 'pending',
        product,
      }
      setOrderItems([...orderItems, newItem])
    }
    setShowProductSelector(false)
  }

  const handleDeleteItem = (tempId: string) => {
    setOrderItems(items => items.filter(item => item.tempId !== tempId))
  }

  const columns: GridColDef[] = [
    {
      field: 'product_name',
      headerName: 'Product',
      flex: 1,
      minWidth: 200,
      valueGetter: params => params.row.product?.name || 'Unknown Product',
    },
    {
      field: 'product_code',
      headerName: 'Code',
      width: 120,
      valueGetter: params => params.row.product?.code || '',
    },
    {
      field: 'quantity',
      headerName: 'Quantity',
      type: 'number',
      width: 120,
      editable: true,
    },
    {
      field: 'unit_price',
      headerName: 'Unit Price',
      type: 'number',
      width: 120,
      editable: true,
      valueFormatter: params => `$${params.value?.toFixed(2) || '0.00'}`,
    },
    {
      field: 'line_total',
      headerName: 'Total',
      type: 'number',
      width: 120,
      valueFormatter: params => `$${params.value?.toFixed(2) || '0.00'}`,
    },
    {
      field: 'is_in_stock',
      headerName: 'Stock',
      width: 100,
      renderCell: params => (
        <Box
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'medium',
            backgroundColor: params.value ? 'success.light' : 'error.light',
            color: params.value ? 'success.contrastText' : 'error.contrastText',
          }}
        >
          {params.value ? 'In Stock' : 'Out of Stock'}
        </Box>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 80,
      getActions: params => [
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDeleteItem(params.row.tempId)}
          color="error"
        />,
      ],
    },
  ]

  const processRowUpdate = useCallback((newRow: GridRowModel, oldRow: GridRowModel) => {
    const updatedRow = { ...newRow }

    // Recalculate line_total
    if (newRow.quantity !== oldRow.quantity || newRow.unit_price !== oldRow.unit_price) {
      updatedRow.line_total = newRow.quantity * newRow.unit_price
    }

    // Update the orderItems state
    setOrderItems(items =>
      items.map(item => (item.tempId === newRow.tempId ? (updatedRow as OrderItemRow) : item))
    )

    return updatedRow
  }, [])

  const onSubmit = async (data: OrderFormData) => {
    try {
      const orderData = {
        ...data,
        notes: data.notes || '',
        shipping_address: data.shipping_address || '',
        delivery_date: data.delivery_date || '',
        order_items: orderItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      }

      let savedOrder: SaleOrder

      if (order?.id) {
        savedOrder = await updateOrderMutation.mutateAsync({ id: order.id, ...orderData })
      } else {
        savedOrder = await createOrderMutation.mutateAsync(orderData)
      }

      onSave?.(savedOrder)
    } catch (error) {
      console.error('Failed to save order:', error)
    }
  }

  const handleSaveDraft = () => {
    handleSubmit(onSubmit)()
  }

  const handleSubmitOrder = async () => {
    if (!order?.id) {
      // Save first, then submit
      const data = watch()
      const orderData = {
        ...data,
        notes: data.notes || '',
        shipping_address: data.shipping_address || '',
        delivery_date: data.delivery_date || '',
        order_items: orderItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      }

      try {
        const savedOrder = await createOrderMutation.mutateAsync(orderData)
        await submitOrderMutation.mutateAsync(savedOrder.id)
        onSave?.(savedOrder)
      } catch (error) {
        console.error('Failed to submit order:', error)
      }
    } else {
      await submitOrderMutation.mutateAsync(order.id)
    }
  }

  const isLoading =
    createOrderMutation.isPending || updateOrderMutation.isPending || submitOrderMutation.isPending

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {order ? 'Edit Order' : 'Create New Order'}
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  {...register('customer_name')}
                  label="Customer Name"
                  fullWidth
                  error={!!errors.customer_name}
                  helperText={errors.customer_name?.message}
                  disabled={isLoading}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  {...register('contact_person')}
                  label="Contact Person"
                  fullWidth
                  error={!!errors.contact_person}
                  helperText={errors.contact_person?.message}
                  disabled={isLoading}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  {...register('email')}
                  label="Email"
                  type="email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={isLoading}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  {...register('delivery_date')}
                  label="Delivery Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  disabled={isLoading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  {...register('shipping_address')}
                  label="Shipping Address"
                  fullWidth
                  multiline
                  rows={2}
                  disabled={isLoading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  {...register('notes')}
                  label="Notes"
                  fullWidth
                  multiline
                  rows={3}
                  disabled={isLoading}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6">Order Items</Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setShowProductSelector(true)}
                disabled={isLoading}
              >
                Add Product
              </Button>
            </Box>

            {orderItems.length === 0 ? (
              <Alert severity="info">No items added yet. Click `Add Product` to get started.</Alert>
            ) : (
              <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid
                  rows={orderItems}
                  columns={columns}
                  getRowId={row => row.tempId}
                  processRowUpdate={processRowUpdate}
                  hideFooter
                  disableRowSelectionOnClick
                />
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="h6">Total: ${calculateTotal().toFixed(2)}</Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <AttachFile sx={{ mr: 1, verticalAlign: 'middle' }} />
              Attachments
            </Typography>

            <FileUpload
              onUploadComplete={urls => {
                setAttachmentUrls(prev => [...prev, ...urls])
              }}
              folder={order?.id ? `orders/${order.id}` : 'temp'}
              disabled={isLoading}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx"
              maxFiles={5}
              maxFileSize={10 * 1024 * 1024} // 10MB
            />

            {attachmentUrls.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Uploaded Files ({attachmentUrls.length})
                </Typography>
                {attachmentUrls.map((url, index) => (
                  <Chip
                    key={index}
                    label={`Attachment ${index + 1}`}
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                    onDelete={() => {
                      setAttachmentUrls(prev => prev.filter((_, i) => i !== index))
                    }}
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>

          <Button
            variant="outlined"
            startIcon={<Save />}
            onClick={handleSaveDraft}
            disabled={isLoading || orderItems.length === 0}
          >
            Save Draft
          </Button>

          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={handleSubmitOrder}
            disabled={isLoading || orderItems.length === 0}
          >
            Submit Order
          </Button>
        </Box>
      </form>

      <ProductSelector
        open={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        onSelect={handleAddProduct}
      />
    </Box>
  )
}
