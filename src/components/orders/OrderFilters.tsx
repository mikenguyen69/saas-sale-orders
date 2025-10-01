'use client'

import React, { useState } from 'react'
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Collapse,
  IconButton,
} from '@mui/material'
import { FilterList, Clear } from '@mui/icons-material'
import type { OrderStatus } from '@/types'

export interface OrderFilters {
  search?: string
  status?: OrderStatus
  salesperson_id?: string
}

interface OrderFiltersProps {
  filters: OrderFilters
  onFiltersChange: (filters: OrderFilters) => void
  userRole?: string
}

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'packing', label: 'Packing' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'rejected', label: 'Rejected' },
]

export function OrderFilters({ filters, onFiltersChange, userRole }: OrderFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  const handleClearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = filters.search || filters.status || filters.salesperson_id

  // Filter status options based on user role
  const availableStatuses = statusOptions.filter(option => {
    if (userRole === 'salesperson') {
      return [
        'draft',
        'submitted',
        'approved',
        'packing',
        'packed',
        'shipped',
        'delivered',
        'fulfilled',
        'rejected',
      ].includes(option.value)
    }
    if (userRole === 'manager') {
      return [
        'submitted',
        'approved',
        'rejected',
        'packing',
        'packed',
        'shipped',
        'delivered',
        'fulfilled',
      ].includes(option.value)
    }
    if (userRole === 'warehouse') {
      return ['approved', 'packing', 'packed', 'shipped', 'delivered', 'fulfilled'].includes(
        option.value
      )
    }
    return true
  })

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          label="Search orders..."
          variant="outlined"
          size="small"
          value={filters.search || ''}
          onChange={e => onFiltersChange({ ...filters, search: e.target.value || undefined })}
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />

        <IconButton
          onClick={() => setShowFilters(!showFilters)}
          color={hasActiveFilters ? 'primary' : 'default'}
        >
          <FilterList />
        </IconButton>

        {hasActiveFilters && (
          <Button
            startIcon={<Clear />}
            onClick={handleClearFilters}
            variant="outlined"
            size="small"
          >
            Clear
          </Button>
        )}
      </Box>

      <Collapse in={showFilters}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                label="Status"
                onChange={e =>
                  onFiltersChange({
                    ...filters,
                    status: (e.target.value as OrderStatus) || undefined,
                  })
                }
              >
                <MenuItem value="">
                  <em>All Statuses</em>
                </MenuItem>
                {availableStatuses.map(status => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  )
}
