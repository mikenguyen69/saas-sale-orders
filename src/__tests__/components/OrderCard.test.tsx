import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ThemeProvider, createTheme } from '@mui/material'
import { OrderCard } from '@/components/orders/OrderCard'
import type { SaleOrder } from '@/types'

const theme = createTheme()

const mockOrder: SaleOrder = {
  id: '1',
  customer_name: 'Test Customer',
  contact_person: 'John Doe',
  email: 'john@example.com',
  shipping_address: '123 Test St, Test City',
  delivery_date: '2024-12-01',
  status: 'draft',
  salesperson_id: 'user1',
  manager_id: null,
  warehouse_id: null,
  notes: 'Test order notes',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  order_items: [
    {
      id: 'item1',
      order_id: '1',
      product_id: 'prod1',
      quantity: 2,
      unit_price: 50,
      line_total: 100,
      is_in_stock: true,
      line_status: 'pending',
    },
    {
      id: 'item2',
      order_id: '1',
      product_id: 'prod2',
      quantity: 1,
      unit_price: 75,
      line_total: 75,
      is_in_stock: true,
      line_status: 'pending',
    },
  ],
}

const mockSubmittedOrder: SaleOrder = {
  ...mockOrder,
  id: '2',
  status: 'submitted',
}

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)
}

describe('OrderCard', () => {
  it('renders order information correctly', () => {
    renderWithTheme(<OrderCard order={mockOrder} />)

    expect(screen.getByText('Test Customer')).toBeInTheDocument()
    expect(screen.getByText('Contact: John Doe')).toBeInTheDocument()
    expect(screen.getByText('Email: john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // item count
    expect(screen.getByText('$175.00')).toBeInTheDocument() // total
  })

  it('calculates order total correctly', () => {
    renderWithTheme(<OrderCard order={mockOrder} />)

    // Total should be 100 + 75 = 175
    expect(screen.getByText('$175.00')).toBeInTheDocument()
  })

  it('displays delivery date when provided', () => {
    renderWithTheme(<OrderCard order={mockOrder} />)

    expect(screen.getByText('12/1/2024')).toBeInTheDocument()
  })

  it('calls onView when view button is clicked', () => {
    const onView = jest.fn()
    renderWithTheme(<OrderCard order={mockOrder} onView={onView} />)

    const viewButton = screen.getByLabelText('View Details')
    fireEvent.click(viewButton)

    expect(onView).toHaveBeenCalledWith(mockOrder)
  })

  it('calls onEdit when edit button is clicked for draft orders', () => {
    const onEdit = jest.fn()
    renderWithTheme(<OrderCard order={mockOrder} onEdit={onEdit} userRole="salesperson" />)

    const editButton = screen.getByLabelText('Edit Order')
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(mockOrder)
  })

  it('shows approve and reject buttons for managers when order is submitted', () => {
    const onApprove = jest.fn()
    const onReject = jest.fn()

    renderWithTheme(
      <OrderCard
        order={mockSubmittedOrder}
        onApprove={onApprove}
        onReject={onReject}
        userRole="manager"
      />
    )

    const approveButton = screen.getByText('Approve')
    const rejectButton = screen.getByText('Reject')

    expect(approveButton).toBeInTheDocument()
    expect(rejectButton).toBeInTheDocument()

    fireEvent.click(approveButton)
    expect(onApprove).toHaveBeenCalledWith(mockSubmittedOrder)

    fireEvent.click(rejectButton)
    expect(onReject).toHaveBeenCalledWith(mockSubmittedOrder)
  })

  it('does not show edit button for non-draft orders', () => {
    renderWithTheme(<OrderCard order={mockSubmittedOrder} userRole="salesperson" />)

    expect(screen.queryByLabelText('Edit Order')).not.toBeInTheDocument()
  })

  it('does not show action buttons when showActions is false', () => {
    renderWithTheme(<OrderCard order={mockOrder} showActions={false} />)

    expect(screen.queryByLabelText('View Details')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Edit Order')).not.toBeInTheDocument()
  })

  it('handles orders with no items', () => {
    const orderWithNoItems = { ...mockOrder, order_items: [] }
    renderWithTheme(<OrderCard order={orderWithNoItems} />)

    expect(screen.getByText('0')).toBeInTheDocument() // item count
    expect(screen.getByText('$0.00')).toBeInTheDocument() // total
  })
})
