import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ThemeProvider, createTheme } from '@mui/material'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { CustomerApi } from '@/services/customerApi'
import type { Customer } from '@/types'

const theme = createTheme()

// Mock CustomerApi
jest.mock('@/services/customerApi')

const mockCustomer: Customer = {
  id: '1',
  name: 'Acme Corporation',
  contact_person: 'John Doe',
  email: 'john@acme.com',
  phone: '555-0100',
  shipping_address: '123 Main St, City, State 12345',
  billing_address: '123 Main St, City, State 12345',
  tenant_id: 'tenant1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('CustomerForm', () => {
  const mockOnSave = jest.fn()
  const mockOnSaveAndSelect = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(CustomerApi.checkEmailAvailability as jest.Mock).mockResolvedValue(true)
    ;(CustomerApi.create as jest.Mock).mockResolvedValue(mockCustomer)
    ;(CustomerApi.update as jest.Mock).mockResolvedValue(mockCustomer)
  })

  const renderCustomerForm = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <CustomerForm onSave={mockOnSave} onCancel={mockOnCancel} {...props} />
      </ThemeProvider>
    )
  }

  describe('Rendering', () => {
    it('renders create mode by default', () => {
      renderCustomerForm()
      expect(screen.getByText('New Customer')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    it('renders edit mode with customer data', () => {
      renderCustomerForm({ customer: mockCustomer, mode: 'edit' })
      expect(screen.getByText('Edit Customer')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Acme Corporation')).toBeInTheDocument()
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@acme.com')).toBeInTheDocument()
    })

    it('renders all form fields', () => {
      renderCustomerForm()
      expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contact person/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/shipping address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/billing address/i)).toBeInTheDocument()
    })

    it('shows Save & Select button in create mode when onSaveAndSelect is provided', () => {
      renderCustomerForm({ onSaveAndSelect: mockOnSaveAndSelect })
      expect(screen.getByRole('button', { name: /save & select/i })).toBeInTheDocument()
    })

    it('does not show Save & Select button in edit mode', () => {
      renderCustomerForm({
        customer: mockCustomer,
        mode: 'edit',
        onSaveAndSelect: mockOnSaveAndSelect,
      })
      expect(screen.queryByRole('button', { name: /save & select/i })).not.toBeInTheDocument()
    })

    it('disables form fields when loading', () => {
      renderCustomerForm({ loading: true })
      expect(screen.getByLabelText(/customer name/i)).toBeDisabled()
      expect(screen.getByLabelText(/contact person/i)).toBeDisabled()
      expect(screen.getByLabelText(/email/i)).toBeDisabled()
    })
  })

  describe('Form validation', () => {
    it('validates required fields', async () => {
      const user = userEvent.setup()
      renderCustomerForm()

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Customer name is required')).toBeInTheDocument()
        expect(screen.getByText('Contact person is required')).toBeInTheDocument()
        expect(screen.getByText('Email is required')).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      renderCustomerForm()

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'invalid-email')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      })
    })

    it('validates field length constraints', async () => {
      const user = userEvent.setup()
      renderCustomerForm()

      const nameInput = screen.getByLabelText(/customer name/i)
      await user.type(nameInput, 'a'.repeat(201))

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Customer name too long')).toBeInTheDocument()
      })
    })

    it('checks for duplicate email', async () => {
      const user = userEvent.setup()
      ;(CustomerApi.checkEmailAvailability as jest.Mock).mockResolvedValue(false)

      renderCustomerForm()

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'existing@example.com')

      await waitFor(() => {
        expect(screen.getByText('A customer with this email already exists')).toBeInTheDocument()
      })
    })

    it('does not check duplicate email for existing customer email', async () => {
      const user = userEvent.setup()
      renderCustomerForm({ customer: mockCustomer, mode: 'edit' })

      const emailInput = screen.getByLabelText(/email/i)
      await user.clear(emailInput)
      await user.type(emailInput, mockCustomer.email)

      await waitFor(() => {
        expect(CustomerApi.checkEmailAvailability).not.toHaveBeenCalled()
      })
    })

    it('debounces email duplicate check', async () => {
      const user = userEvent.setup({ delay: null })
      renderCustomerForm()

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'test@example.com')

      await waitFor(
        () => {
          expect(CustomerApi.checkEmailAvailability).toHaveBeenCalledTimes(1)
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Create mode', () => {
    it('creates new customer successfully', async () => {
      const user = userEvent.setup()
      renderCustomerForm()

      await user.type(screen.getByLabelText(/customer name/i), 'New Company')
      await user.type(screen.getByLabelText(/contact person/i), 'Jane Smith')
      await user.type(screen.getByLabelText(/email/i), 'jane@newcompany.com')
      await user.type(screen.getByLabelText(/phone/i), '555-1234')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(CustomerApi.create).toHaveBeenCalledWith({
          name: 'New Company',
          contact_person: 'Jane Smith',
          email: 'jane@newcompany.com',
          phone: '555-1234',
          shipping_address: undefined,
          billing_address: undefined,
        })
        expect(mockOnSave).toHaveBeenCalledWith(mockCustomer)
      })
    })

    it('creates and selects customer with Save & Select button', async () => {
      const user = userEvent.setup()
      renderCustomerForm({ onSaveAndSelect: mockOnSaveAndSelect })

      await user.type(screen.getByLabelText(/customer name/i), 'New Company')
      await user.type(screen.getByLabelText(/contact person/i), 'Jane Smith')
      await user.type(screen.getByLabelText(/email/i), 'jane@newcompany.com')

      const saveAndSelectButton = screen.getByRole('button', { name: /save & select/i })
      await user.click(saveAndSelectButton)

      await waitFor(() => {
        expect(mockOnSaveAndSelect).toHaveBeenCalledWith(mockCustomer)
        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })

    it('resets form after successful create when resetAfterCreate is true', async () => {
      const user = userEvent.setup()
      renderCustomerForm({ resetAfterCreate: true })

      await user.type(screen.getByLabelText(/customer name/i), 'New Company')
      await user.type(screen.getByLabelText(/contact person/i), 'Jane Smith')
      await user.type(screen.getByLabelText(/email/i), 'jane@newcompany.com')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/customer name/i)).toHaveValue('')
        expect(screen.getByLabelText(/contact person/i)).toHaveValue('')
        expect(screen.getByLabelText(/email/i)).toHaveValue('')
      })
    })

    it('keeps form populated after successful create when resetAfterCreate is false', async () => {
      const user = userEvent.setup()
      renderCustomerForm({ resetAfterCreate: false })

      await user.type(screen.getByLabelText(/customer name/i), 'New Company')
      await user.type(screen.getByLabelText(/contact person/i), 'Jane Smith')
      await user.type(screen.getByLabelText(/email/i), 'jane@newcompany.com')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled()
      })

      // Form should still have the saved values
      expect(screen.getByDisplayValue('Acme Corporation')).toBeInTheDocument()
    })

    it('displays error message on create failure', async () => {
      const user = userEvent.setup()
      ;(CustomerApi.create as jest.Mock).mockRejectedValue(new Error('Failed to create customer'))

      renderCustomerForm()

      await user.type(screen.getByLabelText(/customer name/i), 'New Company')
      await user.type(screen.getByLabelText(/contact person/i), 'Jane Smith')
      await user.type(screen.getByLabelText(/email/i), 'jane@newcompany.com')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to create customer')).toBeInTheDocument()
      })
    })

    it('handles API validation errors', async () => {
      const user = userEvent.setup()
      const apiError = {
        message: 'Validation failed',
        errors: {
          email: ['Email already in use'],
        },
      }
      ;(CustomerApi.create as jest.Mock).mockRejectedValue(apiError)

      renderCustomerForm()

      await user.type(screen.getByLabelText(/customer name/i), 'New Company')
      await user.type(screen.getByLabelText(/contact person/i), 'Jane Smith')
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Email already in use')).toBeInTheDocument()
      })
    })
  })

  describe('Edit mode', () => {
    it('updates customer successfully', async () => {
      const user = userEvent.setup()
      renderCustomerForm({ customer: mockCustomer, mode: 'edit' })

      const nameInput = screen.getByLabelText(/customer name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Company')

      const saveButton = screen.getByRole('button', { name: /update/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(CustomerApi.update).toHaveBeenCalledWith('1', {
          name: 'Updated Company',
          contact_person: 'John Doe',
          email: 'john@acme.com',
          phone: '555-0100',
          shipping_address: '123 Main St, City, State 12345',
          billing_address: '123 Main St, City, State 12345',
        })
        expect(mockOnSave).toHaveBeenCalledWith(mockCustomer)
      })
    })

    it('disables Update button when form is not dirty', () => {
      renderCustomerForm({ customer: mockCustomer, mode: 'edit' })
      const updateButton = screen.getByRole('button', { name: /update/i })
      expect(updateButton).toBeDisabled()
    })

    it('enables Update button when form is dirty', async () => {
      const user = userEvent.setup()
      renderCustomerForm({ customer: mockCustomer, mode: 'edit' })

      const nameInput = screen.getByLabelText(/customer name/i)
      await user.type(nameInput, ' Inc')

      const updateButton = screen.getByRole('button', { name: /update/i })
      expect(updateButton).toBeEnabled()
    })

    it('displays error message on update failure', async () => {
      const user = userEvent.setup()
      ;(CustomerApi.update as jest.Mock).mockRejectedValue(new Error('Failed to update customer'))

      renderCustomerForm({ customer: mockCustomer, mode: 'edit' })

      const nameInput = screen.getByLabelText(/customer name/i)
      await user.type(nameInput, ' Updated')

      const updateButton = screen.getByRole('button', { name: /update/i })
      await user.click(updateButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to update customer')).toBeInTheDocument()
      })
    })
  })

  describe('User interactions', () => {
    it('calls onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderCustomerForm()

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('can close error alert', async () => {
      const user = userEvent.setup()
      ;(CustomerApi.create as jest.Mock).mockRejectedValue(new Error('Test error'))

      renderCustomerForm()

      await user.type(screen.getByLabelText(/customer name/i), 'Test')
      await user.type(screen.getByLabelText(/contact person/i), 'Test')
      await user.type(screen.getByLabelText(/email/i), 'test@test.com')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Test error')).not.toBeInTheDocument()
      })
    })

    it('disables buttons while submitting', async () => {
      const user = userEvent.setup()
      ;(CustomerApi.create as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockCustomer), 100))
      )

      renderCustomerForm()

      await user.type(screen.getByLabelText(/customer name/i), 'Test')
      await user.type(screen.getByLabelText(/contact person/i), 'Test')
      await user.type(screen.getByLabelText(/email/i), 'test@test.com')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(saveButton).toBeDisabled()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('associates labels with inputs', () => {
      renderCustomerForm()
      expect(screen.getByLabelText(/customer name/i)).toHaveAttribute('id')
      expect(screen.getByLabelText(/contact person/i)).toHaveAttribute('id')
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('id')
    })

    it('displays validation errors with proper ARIA attributes', async () => {
      const user = userEvent.setup()
      renderCustomerForm()

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/customer name/i)
        expect(nameInput).toHaveAttribute('aria-invalid', 'true')
      })
    })
  })
})
