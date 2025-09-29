import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ThemeProvider, createTheme } from '@mui/material'
import { CustomerSelector } from '@/components/customers/CustomerSelector'
import type { Customer } from '@/types'

const theme = createTheme()

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

const mockCustomers = [
  mockCustomer,
  {
    id: '2',
    name: 'Tech Solutions Inc',
    contact_person: 'Jane Smith',
    email: 'jane@techsolutions.com',
    phone: '555-0200',
    shipping_address: '456 Oak Ave, Town, State 54321',
    billing_address: '456 Oak Ave, Town, State 54321',
    tenant_id: 'tenant1',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    name: 'Global Enterprises',
    contact_person: 'Bob Johnson',
    email: 'bob@global.com',
    phone: '555-0300',
    shipping_address: '789 Pine Rd, Village, State 98765',
    tenant_id: 'tenant1',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
]

// Mock fetch globally
global.fetch = jest.fn()

describe('CustomerSelector', () => {
  const mockOnChange = jest.fn()
  const mockOnAddNew = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockCustomers }),
    })
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  const renderCustomerSelector = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <CustomerSelector onChange={mockOnChange} {...props} />
      </ThemeProvider>
    )
  }

  describe('Rendering', () => {
    it('renders with default label and placeholder', () => {
      renderCustomerSelector()
      expect(screen.getByLabelText('Customer')).toBeInTheDocument()
    })

    it('renders with custom label and placeholder', () => {
      renderCustomerSelector({
        label: 'Select Customer',
        placeholder: 'Type to search...',
      })
      expect(screen.getByLabelText('Select Customer')).toBeInTheDocument()
    })

    it('renders with initial value', () => {
      renderCustomerSelector({ value: mockCustomer })
      expect(screen.getByDisplayValue('Acme Corporation')).toBeInTheDocument()
    })

    it('displays required indicator when required', () => {
      renderCustomerSelector({ required: true })
      const input = screen.getByLabelText(/Customer/i)
      expect(input).toBeRequired()
    })

    it('displays error state when error prop is true', () => {
      renderCustomerSelector({ error: true, helperText: 'Customer is required' })
      expect(screen.getByText('Customer is required')).toBeInTheDocument()
    })

    it('is disabled when disabled prop is true', () => {
      renderCustomerSelector({ disabled: true })
      const input = screen.getByLabelText('Customer')
      expect(input).toBeDisabled()
    })
  })

  describe('Search functionality', () => {
    it('loads recent customers when opened without search term', async () => {
      const user = userEvent.setup()
      renderCustomerSelector()

      const input = screen.getByLabelText('Customer')
      await user.click(input)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/v1/customers?limit=5')
      })
    })

    it('searches customers when typing', async () => {
      const user = userEvent.setup({ delay: null })
      renderCustomerSelector()

      const input = screen.getByLabelText('Customer')
      await user.click(input)
      await user.type(input, 'Acme')

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/v1/customers?search=Acme')
          )
        },
        { timeout: 1000 }
      )
    })

    it('displays loading indicator while searching', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true, data: mockCustomers }),
                }),
              100
            )
          )
      )

      renderCustomerSelector()
      const input = screen.getByLabelText('Customer')
      await user.click(input)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('displays search results', async () => {
      const user = userEvent.setup()
      renderCustomerSelector()

      const input = screen.getByLabelText('Customer')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
        expect(screen.getByText('Tech Solutions Inc')).toBeInTheDocument()
      })
    })

    it('displays customer details in options', async () => {
      const user = userEvent.setup()
      renderCustomerSelector()

      const input = screen.getByLabelText('Customer')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@acme.com')).toBeInTheDocument()
        expect(screen.getByText('555-0100')).toBeInTheDocument()
      })
    })

    it('displays "No customers found" when search returns empty', async () => {
      const user = userEvent.setup({ delay: null })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })

      renderCustomerSelector()
      const input = screen.getByLabelText('Customer')
      await user.click(input)
      await user.type(input, 'Nonexistent')

      await waitFor(() => {
        expect(screen.getByText('No customers found')).toBeInTheDocument()
      })
    })

    it('displays error message when search fails', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      })

      renderCustomerSelector()
      const input = screen.getByLabelText('Customer')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
      })
    })

    it('debounces search input', async () => {
      const user = userEvent.setup({ delay: null })
      renderCustomerSelector()

      const input = screen.getByLabelText('Customer')
      await user.click(input)
      await user.type(input, 'A')
      await user.type(input, 'c')
      await user.type(input, 'm')
      await user.type(input, 'e')

      // Should only call once after debounce
      await waitFor(
        () => {
          const calls = (global.fetch as jest.Mock).mock.calls.filter((call: string[]) =>
            call[0].includes('search=Acme')
          )
          expect(calls.length).toBeLessThanOrEqual(1)
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Selection', () => {
    it('calls onChange when customer is selected', async () => {
      const user = userEvent.setup()
      renderCustomerSelector()

      const input = screen.getByLabelText('Customer')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
      })

      const option = screen.getByText('Acme Corporation')
      await user.click(option)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '1',
            name: 'Acme Corporation',
            email: 'john@acme.com',
          })
        )
      })
    })

    it('calls onChange with null when selection is cleared', async () => {
      const user = userEvent.setup()
      renderCustomerSelector({ value: mockCustomer })

      const clearButton = screen.getByTitle('Clear')
      await user.click(clearButton)

      expect(mockOnChange).toHaveBeenCalledWith(null)
    })

    it('displays selected customer in input', async () => {
      const user = userEvent.setup()
      renderCustomerSelector()

      const input = screen.getByLabelText('Customer')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
      })

      const option = screen.getByText('Acme Corporation')
      await user.click(option)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Acme Corporation')).toBeInTheDocument()
      })
    })
  })

  describe('Add New Customer', () => {
    it('displays "Add New Customer" button when onAddNew is provided', async () => {
      const user = userEvent.setup()
      renderCustomerSelector({ onAddNew: mockOnAddNew })

      const input = screen.getByLabelText('Customer')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('Add New Customer')).toBeInTheDocument()
      })
    })

    it('does not display "Add New Customer" button when onAddNew is not provided', async () => {
      const user = userEvent.setup()
      renderCustomerSelector()

      const input = screen.getByLabelText('Customer')
      await user.click(input)

      await waitFor(() => {
        expect(screen.queryByText('Add New Customer')).not.toBeInTheDocument()
      })
    })

    it('calls onAddNew when "Add New Customer" button is clicked', async () => {
      const user = userEvent.setup()
      renderCustomerSelector({ onAddNew: mockOnAddNew })

      const input = screen.getByLabelText('Customer')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('Add New Customer')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Add New Customer')
      await user.click(addButton)

      expect(mockOnAddNew).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderCustomerSelector()
      const input = screen.getByLabelText('Customer')
      expect(input).toHaveAttribute('role', 'combobox')
    })

    it('can be navigated with keyboard', async () => {
      const user = userEvent.setup()
      renderCustomerSelector()

      const input = screen.getByLabelText('Customer')
      await user.click(input)
      await user.keyboard('{ArrowDown}')

      await waitFor(() => {
        const listbox = screen.getByRole('listbox')
        expect(listbox).toBeInTheDocument()
      })
    })
  })

  describe('Error handling', () => {
    it('handles network errors gracefully', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      renderCustomerSelector()
      const input = screen.getByLabelText('Customer')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument()
      })
    })

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: 'Database connection failed' }),
      })

      renderCustomerSelector()
      const input = screen.getByLabelText('Customer')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText(/Database connection failed/)).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('does not search with empty input', async () => {
      const user = userEvent.setup()
      renderCustomerSelector()

      const input = screen.getByLabelText('Customer')
      await user.click(input)
      await user.type(input, '   ')

      await waitFor(() => {
        const searchCalls = (global.fetch as jest.Mock).mock.calls.filter((call: string[]) =>
          call[0].includes('search=')
        )
        expect(searchCalls.length).toBe(0)
      })
    })

    it('limits search results to 10 by default', async () => {
      const user = userEvent.setup({ delay: null })
      renderCustomerSelector()

      const input = screen.getByLabelText('Customer')
      await user.click(input)
      await user.type(input, 'test')

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('limit=10')
        )
      })
    })
  })
})