'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Paper,
  Collapse,
  IconButton,
} from '@mui/material'
import { FilterList, Clear } from '@mui/icons-material'
import { useDebounce } from '@/hooks/useDebounce'

export interface ProductFilters {
  search?: string
  category?: string
  inStockOnly?: boolean
}

interface ProductFiltersProps {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
  categories?: string[]
}

export function ProductFilters({ filters, onFiltersChange, categories = [] }: ProductFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [localSearch, setLocalSearch] = useState(filters.search || '')
  const debouncedSearch = useDebounce(localSearch, 300)

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch })
    }
  }, [debouncedSearch, filters, onFiltersChange])

  const handleClearFilters = () => {
    setLocalSearch('')
    onFiltersChange({})
  }

  const hasActiveFilters = filters.search || filters.category || filters.inStockOnly

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          label="Search products..."
          variant="outlined"
          size="small"
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
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
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category || ''}
                label="Category"
                onChange={e =>
                  onFiltersChange({
                    ...filters,
                    category: e.target.value || undefined,
                  })
                }
              >
                <MenuItem value="">
                  <em>All Categories</em>
                </MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={filters.inStockOnly || false}
                  onChange={e =>
                    onFiltersChange({
                      ...filters,
                      inStockOnly: e.target.checked || undefined,
                    })
                  }
                />
              }
              label="In Stock Only"
            />
          </Box>
        </Paper>
      </Collapse>
    </Box>
  )
}
