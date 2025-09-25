-- Migration: Add Customer Model
-- Description: Create customers table with proper tenant isolation via user relationships
-- Date: 2025-09-25
-- JIRA: CCS-34

-- Ensure the trigger function exists (in case it's missing)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    contact_person VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    shipping_address TEXT,
    billing_address TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Add unique constraint for email per user (tenant isolation)
-- This prevents duplicate customers for the same user/tenant
ALTER TABLE customers ADD CONSTRAINT unique_email_per_user UNIQUE (email, created_by);

-- Create indexes for better performance
CREATE INDEX idx_customers_created_by ON customers(created_by);
CREATE INDEX idx_customers_name_created_by ON customers(name, created_by);
CREATE INDEX idx_customers_email_created_by ON customers(email, created_by);
CREATE INDEX idx_customers_deleted_at ON customers(deleted_at);

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers
-- Users can view customers they created (initially - will be updated after customer_id column is added)
CREATE POLICY "Users can view own customers" ON customers
    FOR SELECT USING (
        created_by::text = auth.uid()::text
    );

-- Users can create customers (salespeople, managers)
CREATE POLICY "Users can create customers" ON customers
    FOR INSERT WITH CHECK (
        created_by::text = auth.uid()::text AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role IN ('salesperson', 'manager')
        )
    );

-- Users can update customers they created
CREATE POLICY "Users can update own customers" ON customers
    FOR UPDATE USING (
        created_by::text = auth.uid()::text AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role IN ('salesperson', 'manager')
        )
    );

-- Users can soft delete customers they created (managers and customer creators)
CREATE POLICY "Users can delete own customers" ON customers
    FOR UPDATE USING (
        created_by::text = auth.uid()::text AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role IN ('salesperson', 'manager')
        )
    );

-- Add comment to table for documentation
COMMENT ON TABLE customers IS 'Customer information with tenant isolation via created_by relationship to users';
COMMENT ON COLUMN customers.created_by IS 'User who created this customer - provides tenant isolation';
COMMENT ON COLUMN customers.deleted_at IS 'Soft delete timestamp - NULL means not deleted';