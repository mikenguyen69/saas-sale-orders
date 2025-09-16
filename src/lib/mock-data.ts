import type { Product, SaleOrder } from '@/types'

export const mockProducts: Product[] = [
  {
    id: '1',
    code: 'LAPTOP001',
    name: 'MacBook Pro 16"',
    category: 'Electronics',
    supplier_id: 'supplier1',
    wholesale_price: 2000,
    retail_price: 2500,
    tax_rate: 10,
    stock_quantity: 15,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    code: 'MOUSE001',
    name: 'Wireless Magic Mouse',
    category: 'Electronics',
    supplier_id: 'supplier1',
    wholesale_price: 50,
    retail_price: 79,
    tax_rate: 10,
    stock_quantity: 0, // Out of stock
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    code: 'DESK001',
    name: 'Standing Desk',
    category: 'Furniture',
    supplier_id: 'supplier2',
    wholesale_price: 300,
    retail_price: 450,
    tax_rate: 8,
    stock_quantity: 5, // Low stock
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    code: 'CHAIR001',
    name: 'Ergonomic Office Chair',
    category: 'Furniture',
    supplier_id: 'supplier2',
    wholesale_price: 200,
    retail_price: 299,
    tax_rate: 8,
    stock_quantity: 25,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    code: 'MONITOR001',
    name: '4K Display Monitor',
    category: 'Electronics',
    supplier_id: 'supplier1',
    wholesale_price: 400,
    retail_price: 599,
    tax_rate: 10,
    stock_quantity: 12,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    code: 'BOOK001',
    name: 'JavaScript: The Good Parts',
    category: 'Books',
    supplier_id: 'supplier3',
    wholesale_price: 20,
    retail_price: 35,
    tax_rate: 5,
    stock_quantity: 50,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

export const mockOrders: SaleOrder[] = [
  {
    id: '1',
    customer_name: 'Acme Corporation',
    contact_person: 'John Smith',
    email: 'john@acme.com',
    shipping_address: '123 Business St, New York, NY 10001',
    delivery_date: '2024-12-15',
    status: 'draft',
    salesperson_id: 'dev-user-id',
    manager_id: null,
    warehouse_id: null,
    notes: 'Urgent order for new office setup',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    order_items: [
      {
        id: 'item1',
        order_id: '1',
        product_id: '1',
        quantity: 2,
        unit_price: 2500,
        line_total: 5000,
        is_in_stock: true,
        line_status: 'pending',
        product: mockProducts[0],
      },
      {
        id: 'item2',
        order_id: '1',
        product_id: '5',
        quantity: 1,
        unit_price: 599,
        line_total: 599,
        is_in_stock: true,
        line_status: 'pending',
        product: mockProducts[4],
      },
    ],
  },
  {
    id: '2',
    customer_name: 'Tech Startup Inc',
    contact_person: 'Sarah Johnson',
    email: 'sarah@techstartup.com',
    shipping_address: '456 Innovation Ave, San Francisco, CA 94102',
    delivery_date: '2024-12-20',
    status: 'submitted',
    salesperson_id: 'dev-user-id',
    manager_id: null,
    warehouse_id: null,
    notes: 'New employee onboarding equipment',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    order_items: [
      {
        id: 'item3',
        order_id: '2',
        product_id: '3',
        quantity: 3,
        unit_price: 450,
        line_total: 1350,
        is_in_stock: true,
        line_status: 'pending',
        product: mockProducts[2],
      },
    ],
  },
]

export function getMockProducts(filters: {
  search?: string
  category?: string
  inStockOnly?: boolean
  page?: number
  limit?: number
}) {
  let filtered = [...mockProducts]

  // Apply search filter
  if (filters.search) {
    const search = filters.search.toLowerCase()
    filtered = filtered.filter(
      p => p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search)
    )
  }

  // Apply category filter
  if (filters.category) {
    filtered = filtered.filter(p => p.category === filters.category)
  }

  // Apply stock filter
  if (filters.inStockOnly) {
    filtered = filtered.filter(p => p.stock_quantity > 0)
  }

  // Apply pagination
  const page = filters.page || 1
  const limit = filters.limit || 12
  const total = filtered.length
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const data = filtered.slice(startIndex, endIndex)

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  }
}

export function getMockOrders(filters: {
  search?: string
  status?: string
  page?: number
  limit?: number
}) {
  let filtered = [...mockOrders]

  // Apply search filter
  if (filters.search) {
    const search = filters.search.toLowerCase()
    filtered = filtered.filter(
      o =>
        o.customer_name.toLowerCase().includes(search) ||
        o.contact_person.toLowerCase().includes(search) ||
        o.email.toLowerCase().includes(search)
    )
  }

  // Apply status filter
  if (filters.status) {
    filtered = filtered.filter(o => o.status === filters.status)
  }

  // Apply pagination
  const page = filters.page || 1
  const limit = filters.limit || 12
  const total = filtered.length
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const data = filtered.slice(startIndex, endIndex)

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  }
}
