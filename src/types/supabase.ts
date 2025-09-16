export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          file_url: string
          id: string
          order_id: string
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          file_url: string
          id?: string
          order_id: string
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          file_url?: string
          id?: string
          order_id?: string
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: 'attachments_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'sale_orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attachments_uploaded_by_fkey'
            columns: ['uploaded_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          is_in_stock: boolean | null
          line_status: Database['public']['Enums']['line_status'] | null
          line_total: number
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          is_in_stock?: boolean | null
          line_status?: Database['public']['Enums']['line_status'] | null
          line_total: number
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          id?: string
          is_in_stock?: boolean | null
          line_status?: Database['public']['Enums']['line_status'] | null
          line_total?: number
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'sale_orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string
          id: string
          new_status: string
          order_id: string
          previous_status: string
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          id?: string
          new_status: string
          order_id: string
          previous_status: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          id?: string
          new_status?: string
          order_id?: string
          previous_status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_status_history_changed_by_fkey'
            columns: ['changed_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_status_history_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'sale_orders'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          deleted_at: string | null
          id: string
          name: string
          retail_price: number
          stock_quantity: number
          supplier_id: string | null
          tax_rate: number | null
          updated_at: string | null
          wholesale_price: number
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          retail_price: number
          stock_quantity: number
          supplier_id?: string | null
          tax_rate?: number | null
          updated_at?: string | null
          wholesale_price: number
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          retail_price?: number
          stock_quantity?: number
          supplier_id?: string | null
          tax_rate?: number | null
          updated_at?: string | null
          wholesale_price?: number
        }
        Relationships: []
      }
      sale_orders: {
        Row: {
          contact_person: string
          created_at: string | null
          customer_name: string
          deleted_at: string | null
          delivery_date: string | null
          email: string
          id: string
          manager_id: string | null
          notes: string | null
          salesperson_id: string
          shipping_address: string | null
          status: Database['public']['Enums']['order_status'] | null
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          contact_person: string
          created_at?: string | null
          customer_name: string
          deleted_at?: string | null
          delivery_date?: string | null
          email: string
          id?: string
          manager_id?: string | null
          notes?: string | null
          salesperson_id: string
          shipping_address?: string | null
          status?: Database['public']['Enums']['order_status'] | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          contact_person?: string
          created_at?: string | null
          customer_name?: string
          deleted_at?: string | null
          delivery_date?: string | null
          email?: string
          id?: string
          manager_id?: string | null
          notes?: string | null
          salesperson_id?: string
          shipping_address?: string | null
          status?: Database['public']['Enums']['order_status'] | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'sale_orders_manager_id_fkey'
            columns: ['manager_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sale_orders_salesperson_id_fkey'
            columns: ['salesperson_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sale_orders_warehouse_id_fkey'
            columns: ['warehouse_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          email: string
          id: string
          name: string
          role: Database['public']['Enums']['user_role']
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          email: string
          id?: string
          name: string
          role: Database['public']['Enums']['user_role']
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: Database['public']['Enums']['user_role']
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      soft_delete_order: {
        Args: { order_id: string }
        Returns: undefined
      }
      soft_delete_product: {
        Args: { product_id: string }
        Returns: undefined
      }
      soft_delete_user: {
        Args: { user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      line_status: 'pending' | 'fulfilled' | 'backordered'
      order_status: 'draft' | 'submitted' | 'approved' | 'fulfilled' | 'rejected'
      user_role: 'salesperson' | 'manager' | 'warehouse'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      line_status: ['pending', 'fulfilled', 'backordered'],
      order_status: ['draft', 'submitted', 'approved', 'fulfilled', 'rejected'],
      user_role: ['salesperson', 'manager', 'warehouse'],
    },
  },
} as const
