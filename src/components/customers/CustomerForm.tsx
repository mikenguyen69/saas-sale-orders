'use client'

import React, { useState, useEffect } from 'react'
import { Box, TextField, Button, Grid, Typography, Alert, CircularProgress } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Customer, CustomerCreateData } from '@/types'

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
}

export function CustomerForm({
  customer,
  onSave,
  onSaveAndSelect,
  onCancel,
  mode = 'create',
  loading = false,
}: CustomerFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    setError,
    clearErrors,
    watch,
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

  const email = watch('email')

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

  // Email duplicate validation
  useEffect(() => {
    const checkDuplicateEmail = async () => {
      if (!email || email === customer?.email) {
        clearErrors('email')
        return
      }

      try {
        const response = await fetch(
          `/api/v1/customers?search=${encodeURIComponent(email)}&limit=1`
        )
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data && result.data.length > 0) {
            const existingCustomer = result.data[0]
            if (existingCustomer.email.toLowerCase() === email.toLowerCase()) {
              setError('email', {
                type: 'manual',
                message: 'A customer with this email already exists',
              })
            }
          }
        }
      } catch (error) {
        console.error('Error checking duplicate email:', error)
      }
    }

    const timeoutId = setTimeout(checkDuplicateEmail, 500)
    return () => clearTimeout(timeoutId)
  }, [email, customer?.email, setError, clearErrors])

  const handleFormSubmit = async (data: CustomerFormData, selectAfterSave = false) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const customerData: CustomerCreateData = {
        name: data.name,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone || undefined,
        shipping_address: data.shipping_address || undefined,
        billing_address: data.billing_address || undefined,
      }

      let response: Response
      if (mode === 'edit' && customer) {
        response = await fetch(`/api/v1/customers/${customer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customerData),
        })
      } else {
        response = await fetch('/api/v1/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customerData),
        })
      }

      const result = await response.json()

      if (!response.ok) {
        if (result.errors) {
          // Handle validation errors
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              setError(field as keyof CustomerFormData, {
                type: 'server',
                message: messages[0],
              })
            }
          })
        } else {
          throw new Error(result.error || `HTTP error! status: ${response.status}`)
        }
        return
      }

      if (result.success && result.data) {
        const savedCustomer = result.data
        if (selectAfterSave && onSaveAndSelect) {
          onSaveAndSelect(savedCustomer)
        } else {
          onSave(savedCustomer)
        }

        if (mode === 'create') {
          reset()
        }
      } else {
        throw new Error(result.error || 'Failed to save customer')
      }
    } catch (error) {
      console.error('Error saving customer:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to save customer')
    } finally {
      setIsSubmitting(false)
    }
  }

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
                disabled={loading || isSubmitting || !isDirty}
                startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
              >
                Save & Select
              </Button>
            )}

            <Button
              variant="contained"
              onClick={handleSubmit(onSubmit)}
              disabled={loading || isSubmitting || !isDirty}
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
