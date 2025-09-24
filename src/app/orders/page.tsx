'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Typography,
  Box,
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material'
import { Add, Edit, Visibility, CheckCircle, Cancel, LocalShipping } from '@mui/icons-material'
import { DataGrid, GridColDef, GridActionsCellItem, GridRowParams } from '@mui/x-data-grid'
import { AppLayout } from '@/components/layout/AppLayout'
import { OrderFilters } from '@/components/orders/OrderFilters'
import { OrderActionDialog, type OrderActionType } from '@/components/orders/OrderActionDialog'
import { useOrders, useApproveOrder, useRejectOrder, useFulfillOrder } from '@/hooks/useOrders'
import { useAppUser } from '@/hooks/useAppUser'
import type { SaleOrder } from '@/types'
import type { OrderFilters as IOrderFilters } from '@/components/orders/OrderFilters'

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48]

export default function OrdersPage() {
  const [filters, setFilters] = useState<IOrderFilters>({})
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    action: OrderActionType
    order: SaleOrder | null
  }>({ open: false, action: 'approve', order: null })
  const router = useRouter()

  const { data, isLoading, error } = useOrders({
    ...filters,
    page,
    limit: itemsPerPage,
  })
  const { data: appUser, isLoading: userLoading } = useAppUser()

  const approveOrderMutation = useApproveOrder()
  const rejectOrderMutation = useRejectOrder()
  const fulfillOrderMutation = useFulfillOrder()

  const handleFiltersChange = (newFilters: IOrderFilters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }

  const handleViewOrder = (order: SaleOrder) => {
    router.push(`/orders/${order.id}`)
  }

  const handleEditOrder = (order: SaleOrder) => {
    router.push(`/orders/${order.id}/edit`)
  }

  const handleCreateOrder = () => {
    router.push('/orders/new')
  }

  const handleApproveOrder = (order: SaleOrder) => {
    setActionDialog({ open: true, action: 'approve', order })
  }

  const handleRejectOrder = (order: SaleOrder) => {
    setActionDialog({ open: true, action: 'reject', order })
  }

  const handleConfirmAction = async (notes?: string) => {
    if (!actionDialog.order) return

    try {
      if (actionDialog.action === 'approve') {
        await approveOrderMutation.mutateAsync({ id: actionDialog.order.id, notes })
      } else {
        await rejectOrderMutation.mutateAsync({ id: actionDialog.order.id, notes })
      }
      setActionDialog({ open: false, action: 'approve', order: null })
    } catch (error) {
      console.error(`Failed to ${actionDialog.action} order:`, error)
    }
  }

  const handleCloseDialog = () => {
    setActionDialog({ open: false, action: 'approve', order: null })
  }

  const handleFulfillOrder = async (order: SaleOrder) => {
    try {
      await fulfillOrderMutation.mutateAsync(order.id)
    } catch (error) {
      console.error('Failed to fulfill order:', error)
    }
  }

  const userRole = appUser?.role || 'salesperson'

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default'
      case 'submitted':
        return 'warning'
      case 'approved':
        return 'info'
      case 'fulfilled':
        return 'success'
      case 'rejected':
        return 'error'
      default:
        return 'default'
    }
  }

  // Define DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'Order #',
      width: 120,
      sortable: true,
      renderCell: params => `#${params.value.slice(0, 8)}`,
    },
    {
      field: 'customer_name',
      headerName: 'Customer',
      width: 200,
      sortable: true,
    },
    {
      field: 'contact_person',
      headerName: 'Contact',
      width: 150,
      sortable: true,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      sortable: true,
      renderCell: params => (
        <Chip
          label={params.value.charAt(0).toUpperCase() + params.value.slice(1)}
          color={getStatusColor(params.value) as any}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      sortable: true,
      renderCell: params => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'delivery_date',
      headerName: 'Delivery',
      width: 120,
      sortable: true,
      renderCell: params => (params.value ? new Date(params.value).toLocaleDateString() : 'TBD'),
    },
    {
      field: 'total_amount',
      headerName: 'Total',
      width: 100,
      sortable: true,
      renderCell: params => {
        // Calculate total from order items if available
        const total =
          params.row.items?.reduce((sum: number, item: any) => sum + (item.line_total || 0), 0) || 0
        return `$${total.toFixed(2)}`
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 200,
      getActions: (params: GridRowParams) => {
        const actions = [
          <GridActionsCellItem
            key="view"
            icon={<Visibility />}
            label="View"
            onClick={() => handleViewOrder(params.row)}
          />,
          <GridActionsCellItem
            key="edit"
            icon={<Edit />}
            label="Edit"
            onClick={() => handleEditOrder(params.row)}
            disabled={params.row.status === 'fulfilled' || params.row.status === 'rejected'}
          />,
        ]

        // Add status-specific actions based on user role and order status
        if (userRole === 'manager' && params.row.status === 'submitted') {
          actions.push(
            <GridActionsCellItem
              key="approve"
              icon={<CheckCircle />}
              label="Approve"
              onClick={() => handleApproveOrder(params.row)}
            />,
            <GridActionsCellItem
              key="reject"
              icon={<Cancel />}
              label="Reject"
              onClick={() => handleRejectOrder(params.row)}
            />
          )
        }

        if (userRole === 'warehouse' && params.row.status === 'approved') {
          actions.push(
            <GridActionsCellItem
              key="fulfill"
              icon={<LocalShipping />}
              label="Fulfill"
              onClick={() => handleFulfillOrder(params.row)}
            />
          )
        }

        return actions
      },
    },
  ]

  // Transform data for DataGrid
  const rows =
    data?.data?.map(order => ({
      ...order,
      id: order.id, // DataGrid requires an 'id' field
    })) || []

  if (error) {
    return (
      <AppLayout>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load orders. Please try again.
        </Alert>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Orders
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleCreateOrder}>
          Create Order
        </Button>
      </Box>

      <OrderFilters filters={filters} onFiltersChange={handleFiltersChange} userRole={userRole} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {data?.pagination.total ? `${data.pagination.total} orders found` : ''}
        </Typography>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Per Page</InputLabel>
          <Select
            value={itemsPerPage}
            label="Per Page"
            onChange={e => {
              setItemsPerPage(Number(e.target.value))
              setPage(1)
            }}
          >
            {ITEMS_PER_PAGE_OPTIONS.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading || userLoading}
          paginationMode="server"
          rowCount={data?.pagination.total || 0}
          paginationModel={{ page: page - 1, pageSize: itemsPerPage }}
          onPaginationModelChange={(newModel: any) => {
            setPage(newModel.page + 1)
            setItemsPerPage(newModel.pageSize)
          }}
          pageSizeOptions={ITEMS_PER_PAGE_OPTIONS}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
          slots={{
            noRowsOverlay: () => (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: 2,
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  No orders found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filters.search || filters.status
                    ? 'Try adjusting your filters or search terms.'
                    : 'Get started by creating your first order.'}
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={handleCreateOrder}>
                  Create Order
                </Button>
              </Box>
            ),
          }}
        />
      </Box>

      <OrderActionDialog
        open={actionDialog.open}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmAction}
        action={actionDialog.action}
        orderInfo={{
          id: actionDialog.order?.id || '',
          customerName: actionDialog.order?.customer_name || 'Unknown Customer',
          total:
            actionDialog.order?.order_items?.reduce(
              (total, item) => total + (item.line_total || 0),
              0
            ) || 0,
        }}
        loading={approveOrderMutation.isPending || rejectOrderMutation.isPending}
      />
    </AppLayout>
  )
}
