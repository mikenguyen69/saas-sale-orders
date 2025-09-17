import React from 'react'
import { Card, CardContent, Typography, Box, Chip, IconButton, Tooltip } from '@mui/material'
import { Edit, Visibility, Warning } from '@mui/icons-material'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  onView?: (product: Product) => void
  onEdit?: (product: Product) => void
  showActions?: boolean
}

export function ProductCard({ product, onView, onEdit, showActions = true }: ProductCardProps) {
  const isLowStock = product.stock_quantity <= 10
  const isOutOfStock = product.stock_quantity === 0

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
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}
        >
          <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1, mr: 1 }}>
            {product.name}
          </Typography>
          {showActions && (
            <Box>
              <Tooltip title="View Details">
                <IconButton size="small" onClick={() => onView?.(product)}>
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit Product">
                <IconButton size="small" onClick={() => onEdit?.(product)}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Code: {product.code}
        </Typography>

        {product.category && (
          <Chip label={product.category} size="small" variant="outlined" sx={{ mb: 2 }} />
        )}

        <Box sx={{ mt: 'auto' }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant="body2" color="text.secondary">
              Wholesale
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              ${product.wholesale_price.toFixed(2)}
            </Typography>
          </Box>

          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant="body2" color="text.secondary">
              Retail
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              ${product.retail_price.toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Stock
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {(isLowStock || isOutOfStock) && (
                <Tooltip title={isOutOfStock ? 'Out of stock' : 'Low stock'}>
                  <Warning fontSize="small" color={isOutOfStock ? 'error' : 'warning'} />
                </Tooltip>
              )}
              <Typography
                variant="body1"
                fontWeight="medium"
                color={isOutOfStock ? 'error.main' : isLowStock ? 'warning.main' : 'text.primary'}
              >
                {product.stock_quantity}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
