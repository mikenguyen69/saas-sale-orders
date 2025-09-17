'use client'

import React, { useState } from 'react'
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
import { Add, Edit, Visibility, Inventory } from '@mui/icons-material'
import { DataGrid, GridColDef, GridActionsCellItem, GridRowParams } from '@mui/x-data-grid'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProductFilters } from '@/components/products/ProductFilters'
import { useProducts } from '@/hooks/useProducts'
import type { Product } from '@/types'
import type { ProductFilters as IProductFilters } from '@/components/products/ProductFilters'

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48]

export default function ProductsPage() {
  const [filters, setFilters] = useState<IProductFilters>({})
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  const { data, isLoading, error } = useProducts({
    ...filters,
    page,
    limit: itemsPerPage,
  })

  // Debug: Log the data structure
  console.log('Products data:', data)
  console.log('Data type:', typeof data)
  console.log('Data.data type:', typeof data?.data)
  console.log('Is data.data array:', Array.isArray(data?.data))

  const handleFiltersChange = (newFilters: IProductFilters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }

  const handleViewProduct = (product: Product) => {
    // TODO: Implement product detail modal or navigate to detail page
    console.log('View product:', product)
  }

  const handleEditProduct = (product: Product) => {
    // TODO: Implement product edit modal or navigate to edit page
    console.log('Edit product:', product)
  }

  const handleCreateProduct = () => {
    // TODO: Implement product creation modal or navigate to create page
    console.log('Create new product')
  }

  // Extract unique categories for filter dropdown
  const categories =
    data?.data && Array.isArray(data.data)
      ? (Array.from(new Set(data.data.map(p => p.category).filter(Boolean))) as string[])
      : []

  // Define DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: 'Code',
      width: 120,
      sortable: true,
    },
    {
      field: 'name',
      headerName: 'Product Name',
      width: 250,
      sortable: true,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      sortable: true,
      renderCell: params =>
        params.value ? (
          <Chip label={params.value} size="small" variant="outlined" />
        ) : (
          <span style={{ color: '#666', fontStyle: 'italic' }}>No category</span>
        ),
    },
    {
      field: 'retail_price',
      headerName: 'Price',
      width: 100,
      sortable: true,
      renderCell: params => `$${params.value?.toFixed(2) || '0.00'}`,
    },
    {
      field: 'stock_quantity',
      headerName: 'Stock',
      width: 100,
      sortable: true,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Inventory
            fontSize="small"
            color={params.value <= 10 ? 'error' : params.value <= 50 ? 'warning' : 'success'}
          />
          <span
            style={{
              color: params.value <= 10 ? '#d32f2f' : params.value <= 50 ? '#ed6c02' : '#2e7d32',
            }}
          >
            {params.value}
          </span>
        </Box>
      ),
    },
    {
      field: 'wholesale_price',
      headerName: 'Wholesale',
      width: 120,
      sortable: true,
      renderCell: params => `$${params.value?.toFixed(2) || '0.00'}`,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          key="view"
          icon={<Visibility />}
          label="View"
          onClick={() => handleViewProduct(params.row)}
        />,
        <GridActionsCellItem
          key="edit"
          icon={<Edit />}
          label="Edit"
          onClick={() => handleEditProduct(params.row)}
        />,
      ],
    },
  ]

  // Transform data for DataGrid
  const rows =
    data?.data?.map(product => ({
      ...product,
      id: product.id, // DataGrid requires an 'id' field
    })) || []

  if (error) {
    return (
      <AppLayout>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load products. Please try again.
        </Alert>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Products
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleCreateProduct}>
          Add Product
        </Button>
      </Box>

      <ProductFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        categories={categories}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {data?.pagination.total ? `${data.pagination.total} products found` : ''}
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
          loading={isLoading}
          paginationMode="server"
          rowCount={data?.pagination.total || 0}
          page={page - 1} // DataGrid uses 0-based indexing
          pageSize={itemsPerPage}
          onPageChange={newPage => setPage(newPage + 1)} // Convert back to 1-based
          onPageSizeChange={newPageSize => {
            setItemsPerPage(newPageSize)
            setPage(1)
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
                  No products found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filters.search || filters.category || filters.inStockOnly
                    ? 'Try adjusting your filters or search terms.'
                    : 'Get started by adding your first product.'}
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={handleCreateProduct}>
                  Add Product
                </Button>
              </Box>
            ),
          }}
        />
      </Box>
    </AppLayout>
  )
}
