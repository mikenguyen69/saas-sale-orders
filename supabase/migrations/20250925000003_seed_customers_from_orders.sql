-- Migration: Seed Customers from Existing Orders
-- Description: Extract unique customer data from existing orders and populate customers table
-- Date: 2025-09-25
-- JIRA: CCS-34

-- Create a function to migrate customer data from orders
CREATE OR REPLACE FUNCTION migrate_customers_from_orders()
RETURNS INTEGER AS $$
DECLARE
    customer_count INTEGER := 0;
    order_record RECORD;
    v_customer_id UUID;
BEGIN
    -- Loop through all unique customer combinations from existing orders
    FOR order_record IN (
        SELECT DISTINCT
            customer_name,
            contact_person,
            email,
            shipping_address,
            salesperson_id  -- Use salesperson as the customer creator
        FROM sale_orders
        WHERE customer_id IS NULL  -- Only process orders that haven't been linked to customers yet
        AND deleted_at IS NULL     -- Only active orders
        ORDER BY customer_name, email
    ) LOOP

        -- Check if customer already exists for this user (prevent duplicates)
        SELECT id INTO v_customer_id
        FROM customers
        WHERE email = order_record.email
        AND created_by = order_record.salesperson_id;

        -- If customer doesn't exist, create it
        IF v_customer_id IS NULL THEN
            INSERT INTO customers (
                id,
                name,
                contact_person,
                email,
                phone,
                shipping_address,
                billing_address,
                created_by,
                created_at,
                updated_at
            ) VALUES (
                uuid_generate_v4(),
                order_record.customer_name,
                order_record.contact_person,
                order_record.email,
                NULL,  -- No phone data in orders
                order_record.shipping_address,
                order_record.shipping_address,  -- Use shipping as billing initially
                order_record.salesperson_id,
                NOW(),
                NOW()
            ) RETURNING id INTO v_customer_id;

            customer_count := customer_count + 1;
        END IF;

        -- Link all matching orders to this customer
        UPDATE sale_orders
        SET customer_id = v_customer_id,
            updated_at = NOW()
        WHERE customer_name = order_record.customer_name
        AND contact_person = order_record.contact_person
        AND email = order_record.email
        AND salesperson_id = order_record.salesperson_id
        AND sale_orders.customer_id IS NULL
        AND deleted_at IS NULL;

    END LOOP;

    RETURN customer_count;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
DO $$
DECLARE
    migrated_customers INTEGER;
BEGIN
    SELECT migrate_customers_from_orders() INTO migrated_customers;
    RAISE NOTICE 'Successfully migrated % unique customers from existing orders', migrated_customers;
END $$;

-- Drop the temporary function (cleanup)
DROP FUNCTION IF EXISTS migrate_customers_from_orders();

-- Add some sample customers for development/testing if no real data exists
INSERT INTO customers (
    id,
    name,
    contact_person,
    email,
    phone,
    shipping_address,
    billing_address,
    created_by,
    created_at,
    updated_at
)
SELECT
    uuid_generate_v4(),
    'Acme Corporation',
    'John Smith',
    'john@acme.com',
    '+1-555-0123',
    '123 Business St, New York, NY 10001',
    '123 Business St, New York, NY 10001',
    u.id,
    NOW(),
    NOW()
FROM users u
WHERE u.role IN ('salesperson', 'manager')
AND NOT EXISTS (
    SELECT 1 FROM customers c
    WHERE c.email = 'john@acme.com'
    AND c.created_by = u.id
)
LIMIT 1;

INSERT INTO customers (
    id,
    name,
    contact_person,
    email,
    phone,
    shipping_address,
    billing_address,
    created_by,
    created_at,
    updated_at
)
SELECT
    uuid_generate_v4(),
    'Tech Startup Inc',
    'Sarah Johnson',
    'sarah@techstartup.com',
    '+1-555-0456',
    '456 Innovation Ave, San Francisco, CA 94102',
    '456 Innovation Ave, San Francisco, CA 94102',
    u.id,
    NOW(),
    NOW()
FROM users u
WHERE u.role IN ('salesperson', 'manager')
AND NOT EXISTS (
    SELECT 1 FROM customers c
    WHERE c.email = 'sarah@techstartup.com'
    AND c.created_by = u.id
)
LIMIT 1;

INSERT INTO customers (
    id,
    name,
    contact_person,
    email,
    phone,
    shipping_address,
    billing_address,
    created_by,
    created_at,
    updated_at
)
SELECT
    uuid_generate_v4(),
    'Global Enterprises Ltd',
    'Michael Chen',
    'michael@globalent.com',
    '+1-555-0789',
    '789 Corporate Blvd, Chicago, IL 60601',
    '789 Corporate Blvd, Chicago, IL 60601',
    u.id,
    NOW(),
    NOW()
FROM users u
WHERE u.role IN ('salesperson', 'manager')
AND NOT EXISTS (
    SELECT 1 FROM customers c
    WHERE c.email = 'michael@globalent.com'
    AND c.created_by = u.id
)
LIMIT 1;

INSERT INTO customers (
    id,
    name,
    contact_person,
    email,
    phone,
    shipping_address,
    billing_address,
    created_by,
    created_at,
    updated_at
)
SELECT
    uuid_generate_v4(),
    'Creative Studios Co',
    'Emily Rodriguez',
    'emily@creativestudios.com',
    '+1-555-0321',
    '321 Design District, Austin, TX 78701',
    '321 Design District, Austin, TX 78701',
    u.id,
    NOW(),
    NOW()
FROM users u
WHERE u.role IN ('salesperson', 'manager')
AND NOT EXISTS (
    SELECT 1 FROM customers c
    WHERE c.email = 'emily@creativestudios.com'
    AND c.created_by = u.id
)
LIMIT 1;

INSERT INTO customers (
    id,
    name,
    contact_person,
    email,
    phone,
    shipping_address,
    billing_address,
    created_by,
    created_at,
    updated_at
)
SELECT
    uuid_generate_v4(),
    'Manufacturing Solutions Inc',
    'David Kim',
    'david@mfgsolutions.com',
    '+1-555-0654',
    '654 Industrial Way, Detroit, MI 48201',
    '654 Industrial Way, Detroit, MI 48201',
    u.id,
    NOW(),
    NOW()
FROM users u
WHERE u.role IN ('salesperson', 'manager')
AND NOT EXISTS (
    SELECT 1 FROM customers c
    WHERE c.email = 'david@mfgsolutions.com'
    AND c.created_by = u.id
)
LIMIT 1;

-- Add comments for documentation
COMMENT ON TABLE customers IS 'Customer information migrated from sale_orders and additional seed data for development';

-- Show summary of migrated data
DO $$
DECLARE
    total_customers INTEGER;
    linked_orders INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_customers FROM customers;
    SELECT COUNT(*) INTO linked_orders FROM sale_orders WHERE customer_id IS NOT NULL;

    RAISE NOTICE '=== Customer Migration Summary ===';
    RAISE NOTICE 'Total customers in database: %', total_customers;
    RAISE NOTICE 'Orders linked to customers: %', linked_orders;
    RAISE NOTICE 'Migration completed successfully!';
END $$;