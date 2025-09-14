export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'salesperson' | 'manager' | 'warehouse'
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'salesperson' | 'manager' | 'warehouse'
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'salesperson' | 'manager' | 'warehouse'
          name?: string
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          code: string
          name: string
          category: string | null
          supplier_id: string | null
          wholesale_price: number
          retail_price: number
          tax_rate: number
          stock_quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          category?: string | null
          supplier_id?: string | null
          wholesale_price: number
          retail_price: number
          tax_rate?: number
          stock_quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          category?: string | null
          supplier_id?: string | null
          wholesale_price?: number
          retail_price?: number
          tax_rate?: number
          stock_quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      sale_orders: {
        Row: {
          id: string
          customer_name: string
          contact_person: string
          email: string
          shipping_address: string | null
          delivery_date: string | null
          status: 'draft' | 'submitted' | 'approved' | 'fulfilled' | 'rejected'
          salesperson_id: string
          manager_id: string | null
          warehouse_id: string | null
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          contact_person: string
          email: string
          shipping_address?: string | null
          delivery_date?: string | null
          status?: 'draft' | 'submitted' | 'approved' | 'fulfilled' | 'rejected'
          salesperson_id: string
          manager_id?: string | null
          warehouse_id?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          contact_person?: string
          email?: string
          shipping_address?: string | null
          delivery_date?: string | null
          status?: 'draft' | 'submitted' | 'approved' | 'fulfilled' | 'rejected'
          salesperson_id?: string
          manager_id?: string | null
          warehouse_id?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          line_total: number
          is_in_stock: boolean
          line_status: 'pending' | 'fulfilled' | 'backordered'
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          line_total: number
          is_in_stock?: boolean
          line_status?: 'pending' | 'fulfilled' | 'backordered'
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          line_total?: number
          is_in_stock?: boolean
          line_status?: 'pending' | 'fulfilled' | 'backordered'
        }
      }
      attachments: {
        Row: {
          id: string
          order_id: string
          file_url: string
          uploaded_by: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          order_id: string
          file_url: string
          uploaded_by: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          file_url?: string
          uploaded_by?: string
          uploaded_at?: string
        }
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          previous_status: string
          new_status: string
          changed_by: string
          changed_at: string
        }
        Insert: {
          id?: string
          order_id: string
          previous_status: string
          new_status: string
          changed_by: string
          changed_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          previous_status?: string
          new_status?: string
          changed_by?: string
          changed_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'salesperson' | 'manager' | 'warehouse'
      order_status: 'draft' | 'submitted' | 'approved' | 'fulfilled' | 'rejected'
      line_status: 'pending' | 'fulfilled' | 'backordered'
    }
  }
}
