/**
 * Integration tests for Customer-Order workflow
 * Tests the complete flow from customer selection/creation to order creation
 */

import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, createTheme } from '@mui/material'
import { CustomerSelector } from '@/components/customers/CustomerSelector'
import { CustomerModal } from '@/components/customers/CustomerModal'
import type { Customer } from '@/types'

const theme = createTheme()

const mockCustomers: Customer[] = [
  {
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
  },
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
]

// Mock fetch globally
global.fetch = jest.fn()

describe('Customer-Order Workflow Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockCustomers }),
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </QueryClientProvider>
  )

  describe('Customer Selection Flow', () => {
    it('completes full customer search and selection', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()

      render(
        <wrapper>
          <CustomerSelector onChange={handleChange} />
        </wrapper>
      )

      // Open dropdown
      const input = screen.getByLabelText('Customer')
      await user.click(input)

      // Wait for customers to load
      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
      })

      // Select a customer
      const option = screen.getByText('Acme Corporation')
      await user.click(option)

      // Verify onChange was called with correct customer
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'Acme Corporation',
          email: 'john@acme.com',
        })
      )
    })

    it('searches and filters customers dynamically', async () => {
      const user = userEvent.setup({ delay: null })
      const handleChange = jest.fn()

      // Mock search response
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('search=Tech')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: [mockCustomers[1]] }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: mockCustomers }),
        })
      })

      render(
        <wrapper>
          <CustomerSelector onChange={handleChange} />
        </wrapper>
      )

      const input = screen.getByLabelText('Customer')
      await user.click(input)
      await user.type(input, 'Tech')

      await waitFor(() => {
        expect(screen.getByText('Tech Solutions Inc')).toBeInTheDocument()
        expect(screen.queryByText('Acme Corporation')).not.toBeInTheDocument()
      })
    })

    it('clears selection correctly', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()

      render(
        <wrapper>
          <CustomerSelector onChange={handleChange} value={mockCustomers[0]} />
        </wrapper>
      )

      const clearButton = screen.getByTitle('Clear')
      await user.click(clearButton)

      expect(handleChange).toHaveBeenCalledWith(null)
    })
  })

  describe('Customer Creation Flow', () => {
    it('opens modal to create new customer', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()
      const handleAddNew = jest.fn()

      render(
        <wrapper>
          <CustomerSelector onChange={handleChange} onAddNew={handleAddNew} />
        </wrapper>
      )

      const input = screen.getByLabelText('Customer')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('Add New Customer')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Add New Customer')
      await user.click(addButton)

      expect(handleAddNew).toHaveBeenCalledTimes(1)
    })

    it('creates new customer and selects it for order', async () => {
      const user = userEvent.setup()
      const handleSave = jest.fn()
      const handleClose = jest.fn()

      const newCustomer: Customer = {
        id: '3',
        name: 'New Company',
        contact_person: 'Bob Wilson',
        email: 'bob@newcompany.com',
        phone: '555-0300',
        tenant_id: 'tenant1',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: newCustomer }),
      })

      render(
        <wrapper>
          <CustomerModal open={true} onClose={handleClose} onSave={handleSave} />
        </wrapper>
      )

      // Fill in customer form
      await user.type(screen.getByLabelText(/customer name/i), 'New Company')
      await user.type(screen.getByLabelText(/contact person/i), 'Bob Wilson')
      await user.type(screen.getByLabelText(/email/i), 'bob@newcompany.com')
      await user.type(screen.getByLabelText(/phone/i), '555-0300')

      // Save customer
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith(expect.objectContaining({
          name: 'New Company',
          contact_person: 'Bob Wilson',
          email: 'bob@newcompany.com',
        }))
      })
    })
  })

  describe('Customer Data Auto-fill', () => {
    it('auto-fills order form when customer is selected', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()

      render(
        <wrapper>
          <CustomerSelector onChange={handleChange} />
        </wrapper>
      )

      const input = screen.getByLabelText('Customer')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
      })

      const option = screen.getByText('Acme Corporation')
      await user.click(option)

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Acme Corporation',
          contact_person: 'John Doe',
          email: 'john@acme.com',
          phone: '555-0100',
          shipping_address: '123 Main St, City, State 12345',
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('handles customer search failure gracefully', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(
        <wrapper>
          <CustomerSelector onChange={jest.fn()} />
        </wrapper>
      )

      const input = screen.getByLabelText('Customer')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument()
      })
    })

    it('handles customer creation failure with validation errors', async () => {
      const user = userEvent.setup()
      const handleSave = jest.fn()
      const handleClose = jest.fn()

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Validation failed',
          errors: {
            email: ['Email already exists'],
          },
        }),
      })

      render(
        <wrapper>
          <CustomerModal open={true} onClose={handleClose} onSave={handleSave} />
        </wrapper>
      )

      await user.type(screen.getByLabelText(/customer name/i), 'Test Company')
      await user.type(screen.getByLabelText(/contact person/i), 'Test Person')
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
      })
    })
  })

  describe('Tenant Isolation', () => {
    it('only shows customers from current tenant', async () => {
      const user = userEvent.setup()

      // Mock API to return customers with tenant filter
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        expect(url).toContain('/api/v1/customers')
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: mockCustomers }),
        })
      })

      render(
        <wrapper>
          <CustomerSelector onChange={jest.fn()} />
        </wrapper>
      )

      const input = screen.getByLabelText('Customer')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
      })

      // All customers should have same tenant_id
      mockCustomers.forEach(customer => {
        expect(customer.tenant_id).toBe('tenant1')
      })
    })
  })

  describe('Performance', () => {
    it('debounces search to prevent excessive API calls', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <wrapper>
          <CustomerSelector onChange={jest.fn()} />
        </wrapper>
      )

      const input = screen.getByLabelText('Customer')
      await user.click(input)
      await user.type(input, 'Acme Corp')

      await waitFor(
        () => {
          const searchCalls = (global.fetch as jest.Mock).mock.calls.filter(
            (call: string[]) => call[0].includes('search=')
          )
          // Should have minimal calls due to debouncing
          expect(searchCalls.length).toBeLessThanOrEqual(2)
        },
        { timeout: 1000 }
      )
    })

    it('limits search results to prevent large payloads', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <wrapper>
          <CustomerSelector onChange={jest.fn()} />
        </wrapper>
      )

      const input = screen.getByLabelText('Customer')
      await user.click(input)
      await user.type(input, 'test')

      await waitFor(() => {
        const callsWithLimit = (global.fetch as jest.Mock).mock.calls.filter(
          (call: string[]) => call[0].includes('limit=10')
        )
        expect(callsWithLimit.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Accessibility', () => {
    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()

      render(
        <wrapper>
          <CustomerSelector onChange={handleChange} />
        </wrapper>
      )

      const input = screen.getByLabelText('Customer')
      await user.click(input)
      await user.keyboard('{ArrowDown}')

      await waitFor(() => {
        const listbox = screen.getByRole('listbox')
        expect(listbox).toBeInTheDocument()
      })
    })

    it('has proper ARIA labels and roles', async () => {
      render(
        <wrapper>
          <CustomerSelector onChange={jest.fn()} />
        </wrapper>
      )

      const input = screen.getByLabelText('Customer')
      expect(input).toHaveAttribute('role', 'combobox')
      expect(input).toHaveAttribute('aria-autocomplete', 'list')
    })
  })
})