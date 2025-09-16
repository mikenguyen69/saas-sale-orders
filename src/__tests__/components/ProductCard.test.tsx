import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ThemeProvider, createTheme } from '@mui/material'
import { ProductCard } from '@/components/products/ProductCard'
import type { Product } from '@/types'

const theme = createTheme()

const mockProduct: Product = {
  id: '1',
  code: 'TEST001',
  name: 'Test Product',
  category: 'Electronics',
  supplier_id: 'supplier1',
  wholesale_price: 100,
  retail_price: 150,
  tax_rate: 10,
  stock_quantity: 25,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockLowStockProduct: Product = {
  ...mockProduct,
  id: '2',
  stock_quantity: 5,
}

const mockOutOfStockProduct: Product = {
  ...mockProduct,
  id: '3',
  stock_quantity: 0,
}

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)
}

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    renderWithTheme(<ProductCard product={mockProduct} />)

    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('Code: TEST001')).toBeInTheDocument()
    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
    expect(screen.getByText('$150.00')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('shows low stock warning for products with low inventory', () => {
    renderWithTheme(<ProductCard product={mockLowStockProduct} />)

    expect(screen.getByText('5')).toHaveStyle({ color: 'rgb(237, 108, 2)' })
  })

  it('shows out of stock warning for products with zero inventory', () => {
    renderWithTheme(<ProductCard product={mockOutOfStockProduct} />)

    expect(screen.getByText('0')).toHaveStyle({ color: 'rgb(211, 47, 47)' })
  })

  it('calls onView when view button is clicked', () => {
    const onView = jest.fn()
    renderWithTheme(<ProductCard product={mockProduct} onView={onView} />)

    const viewButton = screen.getByLabelText('View Details')
    fireEvent.click(viewButton)

    expect(onView).toHaveBeenCalledWith(mockProduct)
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn()
    renderWithTheme(<ProductCard product={mockProduct} onEdit={onEdit} />)

    const editButton = screen.getByLabelText('Edit Product')
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(mockProduct)
  })

  it('hides action buttons when showActions is false', () => {
    renderWithTheme(<ProductCard product={mockProduct} showActions={false} />)

    expect(screen.queryByLabelText('View Details')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Edit Product')).not.toBeInTheDocument()
  })

  it('does not render category chip when category is not provided', () => {
    const productWithoutCategory = { ...mockProduct, category: undefined }
    renderWithTheme(<ProductCard product={productWithoutCategory} />)

    expect(screen.queryByText('Electronics')).not.toBeInTheDocument()
  })
})
