export type UserRole = 'salesperson' | 'manager' | 'warehouse'

export type OrderStatus = 'draft' | 'submitted' | 'approved' | 'fulfilled' | 'rejected'

export type LineStatus = 'pending' | 'fulfilled' | 'backordered'

export interface User {
  id: string
  email: string
  role: UserRole
  name: string
  created_at: string
}

export interface Product {
  id: string
  code: string
  name: string
  category?: string
  supplier_id?: string
  wholesale_price: number
  retail_price: number
  tax_rate: number
  stock_quantity: number
  created_at: string
  updated_at: string
}

export interface SaleOrder {
  id: string
  customer_name: string
  contact_person: string
  email: string
  shipping_address?: string
  delivery_date?: string
  status: OrderStatus
  salesperson_id: string
  manager_id?: string
  warehouse_id?: string
  notes: string
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
  attachments?: Attachment[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  line_total: number
  is_in_stock: boolean
  line_status: LineStatus
  product?: Product
}

export interface Attachment {
  id: string
  order_id: string
  file_url: string
  uploaded_by: string
  uploaded_at: string
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  previous_status: string
  new_status: string
  changed_by: string
  changed_at: string
  user?: User
}
