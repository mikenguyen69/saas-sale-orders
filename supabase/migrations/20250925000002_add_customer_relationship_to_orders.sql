-- Migration: Add Customer Relationship to Sale Orders
-- Description: Add optional customer_id foreign key to sale_orders table
-- Date: 2025-09-25
-- JIRA: CCS-34

-- Add customer_id column to sale_orders table (optional for backward compatibility)
ALTER TABLE sale_orders ADD COLUMN customer_id UUID REFERENCES customers(id);

-- Add index for the new foreign key
CREATE INDEX idx_sale_orders_customer_id ON sale_orders(customer_id);

-- Update the existing RLS policy for sale_orders to include customer access
-- Drop the existing "Users can view relevant orders" policy first
DROP POLICY IF EXISTS "Users can view relevant orders" ON sale_orders;

-- Create updated policy that includes customer-based access
CREATE POLICY "Users can view relevant orders" ON sale_orders
    FOR SELECT USING (
        salesperson_id::text = auth.uid()::text OR
        manager_id::text = auth.uid()::text OR
        warehouse_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role IN ('manager', 'warehouse')
        ) OR
        -- Allow access if user created the customer linked to this order
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = sale_orders.customer_id
            AND c.created_by::text = auth.uid()::text
        )
    );

-- Add comment to the new column for documentation
COMMENT ON COLUMN sale_orders.customer_id IS 'Optional reference to customer - NULL for orders with embedded customer data (backward compatibility)';