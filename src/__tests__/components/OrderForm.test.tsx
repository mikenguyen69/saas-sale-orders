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

// Mock CustomerSelector component
interface MockCustomerSelectorProps {
  value?: any
  onChange: (customer: any) => void
  onAddNew?: () => void
  error?: boolean
  helperText?: string
}

jest.mock('../../components/customers/CustomerSelector', () => ({
  CustomerSelector: ({
    value,
    onChange,
    onAddNew,
    error,
    helperText,
  }: MockCustomerSelectorProps) => (
    <div data-testid="customer-selector">
      <input
        data-testid="customer-input"
        value={value?.name || ''}
        onChange={e => {
          const mockCustomer = {
            id: 'cust-1',
            name: e.target.value,
            contact_person: 'John Doe',
            email: 'john@example.com',
            tenant_id: 'tenant-1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          }
          onChange(e.target.value ? mockCustomer : null)
        }}
        placeholder="Select a customer..."
      />
      {onAddNew && (
        <button data-testid="add-new-customer" onClick={onAddNew}>
          Add New Customer
        </button>
      )}
      {error && <div data-testid="customer-error">{helperText}</div>}
    </div>
  ),
}))

// Mock CustomerModal component
interface MockCustomerModalProps {
  open: boolean
  onClose: () => void
  onSave: (customer: any) => void
  onSaveAndSelect: (customer: any) => void
}

jest.mock('../../components/customers/CustomerModal', () => ({
  CustomerModal: ({ open, onClose, onSave, onSaveAndSelect }: MockCustomerModalProps) =>
    open ? (
      <div data-testid="customer-modal">
        <button
          data-testid="save-customer"
          onClick={() => {
            const mockCustomer = {
              id: 'new-cust-1',
              name: 'New Customer',
              contact_person: 'Jane Doe',
              email: 'jane@example.com',
              tenant_id: 'tenant-1',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            }
            onSave(mockCustomer)
          }}
        >
          Save Customer
        </button>
        <button
          data-testid="save-and-select-customer"
          onClick={() => {
            const mockCustomer = {
              id: 'new-cust-2',
              name: 'New Customer 2',
              contact_person: 'Bob Smith',
              email: 'bob@example.com',
              tenant_id: 'tenant-1',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            }
            onSaveAndSelect(mockCustomer)
          }}
        >
          Save & Select
        </button>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
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

const mockCustomer = {
  id: 'cust-1',
  name: 'Test Customer',
  contact_person: 'John Doe',
  email: 'john@example.com',
  phone: '555-0123',
  shipping_address: '123 Test St',
  billing_address: '456 Bill St',
  tenant_id: 'tenant-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockOrder = {
  id: '1',
  customer_id: 'cust-1',
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
  customer: mockCustomer,
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
    // Clear any previous renders
    document.body.innerHTML = ''
  })

  it('renders form fields correctly', () => {
    renderWithProviders(<OrderForm />)

    expect(screen.getByTestId('customer-selector')).toBeInTheDocument()
    expect(screen.getByLabelText('Delivery Date')).toBeInTheDocument()
    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
  })

  it('calls createOrder with correct customer and items field structure', async () => {
    renderWithProviders(<OrderForm />)

    // Select a customer
    fireEvent.change(screen.getByTestId('customer-input'), {
      target: { value: 'Test Customer' },
    })

    // Add a product
    fireEvent.click(screen.getByText('Add Product'))
    expect(screen.getByTestId('product-selector')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Select Product'))

    // Submit the form
    fireEvent.click(screen.getByText('Save Draft'))

    await waitFor(() => {
      expect(mockCreateMutation.mutateAsync).toHaveBeenCalledWith({
        customer_id: 'cust-1',
        customer_name: 'Test Customer',
        contact_person: 'John Doe',
        email: 'john@example.com',
        shipping_address: '',
        notes: '',
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

  it('prevents submission when no customer or items are selected', () => {
    renderWithProviders(<OrderForm />)

    const saveDraftButton = screen.getByText('Save Draft')
    const submitOrderButton = screen.getByText('Submit Order')

    expect(saveDraftButton).toBeDisabled()
    expect(submitOrderButton).toBeDisabled()
  })

  it('enables submission when customer is selected and items are added', async () => {
    renderWithProviders(<OrderForm />)

    // Select a customer
    fireEvent.change(screen.getByTestId('customer-input'), {
      target: { value: 'Test Customer' },
    })

    // Add a product
    fireEvent.click(screen.getByText('Add Product'))
    fireEvent.click(screen.getByText('Select Product'))

    // Should be enabled after selecting customer and adding item
    await waitFor(() => {
      expect(screen.getByText('Save Draft')).not.toBeDisabled()
      expect(screen.getByText('Submit Order')).not.toBeDisabled()
    })
  })

  describe('Customer Selection', () => {
    it('shows customer selector and allows customer selection', () => {
      renderWithProviders(<OrderForm />)

      const customerSelector = screen.getByTestId('customer-selector')
      expect(customerSelector).toBeInTheDocument()

      const customerInput = screen.getByTestId('customer-input')
      expect(customerInput).toHaveAttribute('placeholder', 'Select a customer...')
    })

    it('shows Add New Customer button', () => {
      renderWithProviders(<OrderForm />)

      const addNewButton = screen.getByTestId('add-new-customer')
      expect(addNewButton).toBeInTheDocument()
      expect(addNewButton).toHaveTextContent('Add New Customer')
    })

    it('opens customer modal when Add New Customer is clicked', () => {
      renderWithProviders(<OrderForm />)

      fireEvent.click(screen.getByTestId('add-new-customer'))

      expect(screen.getByTestId('customer-modal')).toBeInTheDocument()
    })

    it('selects customer from modal and updates form', async () => {
      renderWithProviders(<OrderForm />)

      // Open modal
      fireEvent.click(screen.getByTestId('add-new-customer'))
      expect(screen.getByTestId('customer-modal')).toBeInTheDocument()

      // Save and select customer
      fireEvent.click(screen.getByTestId('save-and-select-customer'))

      // Modal should close and customer should be selected
      await waitFor(() => {
        expect(screen.queryByTestId('customer-modal')).not.toBeInTheDocument()
      })

      // Check if customer details are displayed
      expect(screen.getByText('Selected Customer Details')).toBeInTheDocument()
      expect(screen.getByText('Contact Person: Bob Smith')).toBeInTheDocument()
      expect(screen.getByText('Email: bob@example.com')).toBeInTheDocument()
    })

    it('prevents form submission without customer selection', async () => {
      renderWithProviders(<OrderForm />)

      // Add a product but no customer
      fireEvent.click(screen.getByText('Add Product'))
      fireEvent.click(screen.getByText('Select Product'))

      // Form should still be disabled
      expect(screen.getByText('Save Draft')).toBeDisabled()
      expect(screen.getByText('Submit Order')).toBeDisabled()
    })

    it('shows customer details when customer is selected', () => {
      renderWithProviders(<OrderForm />)

      // Select a customer
      fireEvent.change(screen.getByTestId('customer-input'), {
        target: { value: 'Test Customer' },
      })

      // Customer details should be displayed
      expect(screen.getByText('Selected Customer Details')).toBeInTheDocument()
      expect(screen.getByText('Contact Person: John Doe')).toBeInTheDocument()
      expect(screen.getByText('Email: john@example.com')).toBeInTheDocument()
    })
  })

  describe('Existing Order Editing', () => {
    it('loads existing order with customer information', () => {
      renderWithProviders(<OrderForm order={mockOrder} />)

      // Should show customer details for existing order
      expect(screen.getByText('Edit Order')).toBeInTheDocument()
      expect(screen.getByText('Selected Customer Details')).toBeInTheDocument()
      expect(screen.getByText('Contact Person: John Doe')).toBeInTheDocument()
    })

    it('updates order with customer information', async () => {
      renderWithProviders(<OrderForm order={mockOrder} />)

      // Change customer
      fireEvent.change(screen.getByTestId('customer-input'), {
        target: { value: 'New Customer' },
      })

      // Add delivery date
      fireEvent.change(screen.getByLabelText('Delivery Date'), {
        target: { value: '2024-12-15' },
      })

      // Submit the form
      fireEvent.click(screen.getByText('Save Draft'))

      await waitFor(() => {
        expect(mockUpdateMutation.mutateAsync).toHaveBeenCalledWith({
          id: '1',
          customer_id: 'cust-1',
          customer_name: 'New Customer',
          contact_person: 'John Doe',
          email: 'john@example.com',
          shipping_address: '',
          notes: 'Test notes',
          delivery_date: '2024-12-15',
          items: [],
        })
      })
    })
  })
})
