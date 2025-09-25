import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, createTheme } from '@mui/material'
import { OrderForm } from '../../components/orders/OrderForm'

// Mock the hooks module
const mockCreateMutation = {
  mutateAsync: jest.fn(),
  isPending: false,
}
const mockUpdateMutation = {
  mutateAsync: jest.fn(),
  isPending: false,
}
const mockSubmitMutation = {
  mutateAsync: jest.fn(),
  isPending: false,
}

jest.mock('../../hooks/useOrders', () => ({
  useCreateOrder: () => mockCreateMutation,
  useUpdateOrder: () => mockUpdateMutation,
  useSubmitOrder: () => mockSubmitMutation,
}))

// Mock ProductSelector component
jest.mock('../../components/orders/ProductSelector', () => ({
  ProductSelector: ({ open, onClose, onSelect }: any) =>
    open ? (
      <div data-testid="product-selector">
        <button
          onClick={() =>
            onSelect({
              id: 'prod-1',
              name: 'Test Product',
              code: 'TEST-001',
              retail_price: 50,
              stock_quantity: 10,
            })
          }
        >
          Select Product
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

// Skip FileUpload testing for now
jest.mock('../../components/ui/FileUpload', () => ({
  FileUpload: () => null,
}))

const theme = createTheme()

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </QueryClientProvider>
  )
}

const mockOrder = {
  id: '1',
  customer_name: 'Test Customer',
  contact_person: 'John Doe',
  email: 'john@example.com',
  shipping_address: '123 Test St',
  delivery_date: '2024-12-01',
  status: 'draft' as const,
  salesperson_id: 'user1',
  manager_id: undefined,
  warehouse_id: undefined,
  notes: 'Test notes',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  items: [
    {
      id: 'item1',
      order_id: '1',
      product_id: 'prod1',
      quantity: 2,
      unit_price: 50,
      line_total: 100,
      is_in_stock: true,
      line_status: 'pending' as const,
    },
  ],
}

describe('OrderForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateMutation.mutateAsync.mockResolvedValue(mockOrder)
    mockUpdateMutation.mutateAsync.mockResolvedValue(mockOrder)
    mockSubmitMutation.mutateAsync.mockResolvedValue({})
  })

  it('renders form fields correctly', () => {
    renderWithProviders(<OrderForm />)

    expect(screen.getByLabelText('Customer Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Contact Person')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Delivery Date')).toBeInTheDocument()
    expect(screen.getByLabelText('Shipping Address')).toBeInTheDocument()
    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
  })

  it('calls createOrder with correct items field structure (not order_items)', async () => {
    renderWithProviders(<OrderForm />)

    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Customer Name'), {
      target: { value: 'Test Customer' },
    })
    fireEvent.change(screen.getByLabelText('Contact Person'), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' },
    })

    // Add a product
    fireEvent.click(screen.getByText('Add Product'))
    expect(screen.getByTestId('product-selector')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Select Product'))

    // Submit the form
    fireEvent.click(screen.getByText('Save Draft'))

    await waitFor(() => {
      expect(mockCreateMutation.mutateAsync).toHaveBeenCalledWith({
        customer_name: 'Test Customer',
        contact_person: 'John Doe',
        email: 'john@example.com',
        notes: '',
        shipping_address: '',
        delivery_date: '',
        items: [
          {
            product_id: 'prod-1',
            quantity: 1,
            unit_price: 50,
          },
        ],
      })
    })
  })

  it('prevents submission when no items are added', () => {
    renderWithProviders(<OrderForm />)

    const saveDraftButton = screen.getByText('Save Draft')
    const submitOrderButton = screen.getByText('Submit Order')

    expect(saveDraftButton).toBeDisabled()
    expect(submitOrderButton).toBeDisabled()
  })

  it('enables submission when items are added', async () => {
    renderWithProviders(<OrderForm />)

    // Add a product
    fireEvent.click(screen.getByText('Add Product'))
    fireEvent.click(screen.getByText('Select Product'))

    // Should be enabled after adding item
    await waitFor(() => {
      expect(screen.getByText('Save Draft')).not.toBeDisabled()
      expect(screen.getByText('Submit Order')).not.toBeDisabled()
    })
  })
})
