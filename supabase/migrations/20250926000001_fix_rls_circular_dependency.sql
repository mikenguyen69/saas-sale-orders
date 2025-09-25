-- HOTFIX: Fix circular dependency in RLS policies
-- Description: Remove circular references between sale_orders and customers policies
-- Date: 2025-09-26
-- Issue: Infinite recursion in sale_orders policy

-- Drop the problematic policies that create circular dependency
DROP POLICY IF EXISTS "Users can view relevant orders" ON sale_orders;
DROP POLICY IF EXISTS "Users can view own customers" ON customers;

-- Recreate sale_orders policy WITHOUT customer table reference
CREATE POLICY "Users can view relevant orders" ON sale_orders
    FOR SELECT USING (
        salesperson_id::text = auth.uid()::text OR
        manager_id::text = auth.uid()::text OR
        warehouse_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role IN ('manager', 'warehouse')
        )
    );

-- Recreate customers policy WITHOUT sale_orders table reference
CREATE POLICY "Users can view own customers" ON customers
    FOR SELECT USING (
        created_by::text = auth.uid()::text
    );

-- Add comment explaining the fix
COMMENT ON TABLE sale_orders IS 'Sale orders with tenant isolation via user relationships - no circular RLS dependencies';
COMMENT ON TABLE customers IS 'Customers with tenant isolation via created_by field - no circular RLS dependencies';