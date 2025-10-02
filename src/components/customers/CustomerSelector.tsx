'use client'

import React, { useState, useMemo } from 'react'
import {
  Autocomplete,
  TextField,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Chip,
  InputAdornment,
} from '@mui/material'
import { Search, PersonAdd } from '@mui/icons-material'
import { useDebounce } from '@/hooks/useDebounce'
import { useCustomers } from '@/hooks/useCustomers'
import { Customer } from '@/types'

interface CustomerSelectorProps {
  value?: Customer | null
  onChange: (customer: Customer | null) => void
  onAddNew?: () => void
  disabled?: boolean
  error?: boolean
  helperText?: string
  required?: boolean
  placeholder?: string
  label?: string
}

export function CustomerSelector({
  value,
  onChange,
  onAddNew,
  disabled = false,
  error = false,
  helperText,
  required = false,
  placeholder = 'Search customers...',
  label = 'Customer',
}: CustomerSelectorProps) {
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)

  const debouncedSearch = useDebounce(inputValue, 300)

  // Use the proper hook for customer search with authentication
  const {
    data: searchResult,
    isLoading: loading,
    error: queryError,
  } = useCustomers(
    {
      search: debouncedSearch || undefined,
      limit: debouncedSearch ? 10 : 5,
    },
    open // Only fetch when dropdown is open
  )

  const options = useMemo(() => {
    return searchResult?.data || []
  }, [searchResult])

  const searchError = useMemo(() => {
    return queryError
      ? queryError instanceof Error
        ? queryError.message
        : 'Failed to load customers'
      : null
  }, [queryError])

  // Custom option rendering
  const renderOption = (props: React.HTMLAttributes<HTMLLIElement>, option: Customer) => (
    <li {...props} key={option.id}>
      <Box sx={{ width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 0.5,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {option.name}
          </Typography>
          {option.phone && (
            <Typography variant="caption" color="text.secondary">
              {option.phone}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {option.contact_person}
          </Typography>
          <Chip label={option.email} size="small" variant="outlined" />
        </Box>

        {option.shipping_address && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {option.shipping_address.length > 50
              ? `${option.shipping_address.substring(0, 50)}...`
              : option.shipping_address}
          </Typography>
        )}
      </Box>
    </li>
  )

  // Custom paper component with Add New button
  const PaperComponent = ({ children, ...props }: React.ComponentProps<typeof Paper>) => (
    <Paper {...props}>
      {children}
      {onAddNew && (
        <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<PersonAdd />}
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              onAddNew()
            }}
            onMouseDown={e => {
              // Prevent Autocomplete from closing when clicking the button
              e.preventDefault()
            }}
            size="small"
          >
            Add New Customer
          </Button>
        </Box>
      )}
    </Paper>
  )

  // No options message
  const noOptionsText = useMemo(() => {
    if (loading) return 'Searching...'
    if (searchError) return `Error: ${searchError}`
    if (inputValue && options.length === 0) return 'No customers found'
    return 'Start typing to search customers'
  }, [loading, searchError, inputValue, options.length])

  // Handle selection change
  const handleSelectionChange = (event: React.SyntheticEvent, newValue: Customer | null) => {
    onChange(newValue)
  }

  return (
    <Box>
      <Autocomplete
        value={value || null}
        onChange={handleSelectionChange}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue)
        }}
        options={options}
        loading={loading}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        getOptionLabel={option => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        filterOptions={x => x} // Disable built-in filtering since we handle it server-side
        renderInput={params => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            error={error}
            helperText={helperText}
            required={required}
            disabled={disabled}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
        renderOption={renderOption}
        PaperComponent={onAddNew ? PaperComponent : undefined}
        noOptionsText={noOptionsText}
        clearOnBlur={false}
        selectOnFocus
        handleHomeEndKeys
        freeSolo={false}
        disabled={disabled}
      />

      {searchError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {searchError}
        </Alert>
      )}
    </Box>
  )
}
