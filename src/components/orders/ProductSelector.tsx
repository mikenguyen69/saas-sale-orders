'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  InputAdornment,
} from '@mui/material'
import { Search, Close } from '@mui/icons-material'
import { useProducts } from '@/hooks/useProducts'
import { ProductListSkeleton } from '@/components/ui/SkeletonLoader'
import { useDebounce } from '@/hooks/useDebounce'
import type { Product } from '@/types'

interface ProductSelectorProps {
  open: boolean
  onClose: () => void
  onSelect: (product: Product) => void
}

export function ProductSelector({ open, onClose, onSelect }: ProductSelectorProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useProducts({
    search: debouncedSearch,
    category: selectedCategory || undefined,
    inStockOnly: true,
    limit: 50,
  })

  const categories = data?.data
    ? (Array.from(new Set(data.data.map(p => p.category).filter(Boolean))) as string[])
    : []

  const handleProductSelect = (product: Product) => {
    onSelect(product)
    setSearch('')
    setSelectedCategory('')
  }

  const handleClose = () => {
    onClose()
    setSearch('')
    setSelectedCategory('')
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Select Product</Typography>
          <Button onClick={handleClose} size="small" sx={{ minWidth: 'auto', p: 1 }}>
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {categories.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="All Categories"
                variant={selectedCategory === '' ? 'filled' : 'outlined'}
                onClick={() => setSelectedCategory('')}
                size="small"
              />
              {categories.map(category => (
                <Chip
                  key={category}
                  label={category}
                  variant={selectedCategory === category ? 'filled' : 'outlined'}
                  onClick={() => setSelectedCategory(category)}
                  size="small"
                />
              ))}
            </Box>
          )}
        </Box>

        {isLoading ? (
          <ProductListSkeleton count={8} />
        ) : (
          <Grid container spacing={2} sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
            {data?.data.length === 0 ? (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    No products found matching your criteria.
                  </Typography>
                </Box>
              </Grid>
            ) : (
              data?.data.map(product => (
                <Grid item xs={12} sm={6} key={product.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 3,
                      },
                    }}
                    onClick={() => handleProductSelect(product)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Typography variant="subtitle1" noWrap sx={{ flexGrow: 1, mr: 1 }}>
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.code}
                        </Typography>
                      </Box>

                      {product.category && (
                        <Chip
                          label={product.category}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      )}

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="body1" fontWeight="medium">
                          ${product.retail_price.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Stock: {product.stock_quantity}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  )
}
