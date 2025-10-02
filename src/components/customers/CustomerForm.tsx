'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Box, TextField, Button, Grid, Typography, Alert, CircularProgress } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Customer, CustomerCreateData } from '@/types'
import { CustomerApi } from '@/services/customerApi'
import { isApiError } from '@/utils/api'
import { useCheckEmailAvailability } from '@/hooks/useCustomers'

const customerSchema = yup.object({
  name: yup.string().required('Customer name is required').max(200, 'Customer name too long'),
  contact_person: yup
    .string()
    .required('Contact person is required')
    .max(100, 'Contact person name too long'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  phone: yup.string().max(20, 'Phone number too long'),
  shipping_address: yup.string().max(500, 'Shipping address too long'),
  billing_address: yup.string().max(500, 'Billing address too long'),
})

type CustomerFormData = yup.InferType<typeof customerSchema>

interface CustomerFormProps {
  customer?: Customer
  onSave: (customer: Customer) => void
  onSaveAndSelect?: (customer: Customer) => void
  onCancel: () => void
  mode?: 'create' | 'edit'
  loading?: boolean
  resetAfterCreate?: boolean
}

export function CustomerForm({
  customer,
  onSave,
  onSaveAndSelect,
  onCancel,
  mode = 'create',
  loading = false,
  resetAfterCreate = false,
}: CustomerFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const checkEmailMutation = useCheckEmailAvailability()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
    setError,
  } = useForm<CustomerFormData>({
    resolver: yupResolver(customerSchema),
    defaultValues: {
      name: customer?.name || '',
      contact_person: customer?.contact_person || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      shipping_address: customer?.shipping_address || '',
      billing_address: customer?.billing_address || '',
    },
  })

  // Reset form when customer prop changes
  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        contact_person: customer.contact_person,
        email: customer.email,
        phone: customer.phone || '',
        shipping_address: customer.shipping_address || '',
        billing_address: customer.billing_address || '',
      })
    }
  }, [customer, reset])

  // Email validation - check for duplicates on submit
  const checkEmailDuplicate = useCallback(
    async (email: string): Promise<boolean> => {
      if (!email || email === customer?.email) {
        return true // Email is valid (unchanged or empty)
      }

      try {
        const isAvailable = await checkEmailMutation.mutateAsync({
          email,
          excludeCustomerId: customer?.id,
        })

        if (!isAvailable) {
          setError('email', {
            type: 'manual',
            message: 'A customer with this email already exists',
          })
          return false
        }

        return true
      } catch (error) {
        console.error('Error checking duplicate email:', error)
        // Allow submission if check fails to avoid blocking user
        return true
      }
    },
    [customer?.email, customer?.id, setError, checkEmailMutation]
  )

  const handleFormSubmit = useCallback(
    async (data: CustomerFormData, selectAfterSave = false) => {
      setSubmitError(null)

      // Validate email for duplicates before submitting
      const isEmailValid = await checkEmailDuplicate(data.email)
      if (!isEmailValid) {
        return // Stop submission if email is duplicate
      }

      try {
        const customerData: CustomerCreateData = {
          name: data.name,
          contact_person: data.contact_person,
          email: data.email,
          phone: data.phone || undefined,
          shipping_address: data.shipping_address || undefined,
          billing_address: data.billing_address || undefined,
        }

        let savedCustomer: Customer
        if (mode === 'edit' && customer) {
          savedCustomer = await CustomerApi.update(customer.id, customerData)
        } else {
          savedCustomer = await CustomerApi.create(customerData)
        }

        if (selectAfterSave && onSaveAndSelect) {
          onSaveAndSelect(savedCustomer)
        } else {
          onSave(savedCustomer)
        }

        // Improved reset logic for create mode
        if (mode === 'create') {
          if (resetAfterCreate) {
            reset() // Reset to empty form
          } else {
            // Reset to the saved customer's values (keeps form populated)
            reset({
              name: savedCustomer.name,
              contact_person: savedCustomer.contact_person,
              email: savedCustomer.email,
              phone: savedCustomer.phone || '',
              shipping_address: savedCustomer.shipping_address || '',
              billing_address: savedCustomer.billing_address || '',
            })
          }
        }
      } catch (error) {
        console.error('Error saving customer:', error)

        if (isApiError(error)) {
          // Handle validation errors from API
          if (error.errors) {
            Object.entries(error.errors).forEach(([field, messages]) => {
              if (Array.isArray(messages) && messages.length > 0) {
                setError(field as keyof CustomerFormData, {
                  type: 'server',
                  message: messages[0],
                })
              }
            })
          } else {
            setSubmitError(error.message)
          }
        } else {
          setSubmitError(error instanceof Error ? error.message : 'Failed to save customer')
        }
      }
    },
    [
      mode,
      customer,
      onSave,
      onSaveAndSelect,
      reset,
      resetAfterCreate,
      setError,
      checkEmailDuplicate,
    ]
  )

  const onSubmit = (data: CustomerFormData) => {
    handleFormSubmit(data, false)
  }

  const onSubmitAndSelect = (data: CustomerFormData) => {
    handleFormSubmit(data, true)
  }

  return (
    <Box component="form" noValidate>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            {mode === 'edit' ? 'Edit Customer' : 'New Customer'}
          </Typography>
        </Grid>

        {submitError && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          </Grid>
        )}

        <Grid item xs={12} sm={6}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Customer Name"
                required
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={loading || isSubmitting}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="contact_person"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Contact Person"
                required
                error={!!errors.contact_person}
                helperText={errors.contact_person?.message}
                disabled={loading || isSubmitting}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Email"
                type="email"
                required
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={loading || isSubmitting}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Phone"
                error={!!errors.phone}
                helperText={errors.phone?.message}
                disabled={loading || isSubmitting}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="shipping_address"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Shipping Address"
                multiline
                rows={3}
                error={!!errors.shipping_address}
                helperText={errors.shipping_address?.message}
                disabled={loading || isSubmitting}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="billing_address"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Billing Address"
                multiline
                rows={3}
                error={!!errors.billing_address}
                helperText={errors.billing_address?.message}
                disabled={loading || isSubmitting}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="outlined" onClick={onCancel} disabled={loading || isSubmitting}>
              Cancel
            </Button>

            {onSaveAndSelect && mode === 'create' && (
              <Button
                variant="outlined"
                onClick={handleSubmit(onSubmitAndSelect)}
                disabled={loading || isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
              >
                Save & Select
              </Button>
            )}

            <Button
              variant="contained"
              onClick={handleSubmit(onSubmit)}
              disabled={loading || isSubmitting || (mode === 'edit' && !isDirty)}
              startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
            >
              {mode === 'edit' ? 'Update' : 'Save'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
