-- Seed Data for SaaS Sale Orders - Customer Management
-- This file can be run independently to populate customer data

-- Insert sample customers (will be linked to first available salesperson)
WITH first_salesperson AS (
    SELECT id FROM users WHERE role IN ('salesperson', 'manager') LIMIT 1
)
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
SELECT * FROM (
    VALUES
        (
            uuid_generate_v4(),
            'Acme Corporation',
            'John Smith',
            'john@acme.com',
            '+1-555-0123',
            '123 Business St, New York, NY 10001',
            '123 Business St, New York, NY 10001',
            (SELECT id FROM first_salesperson),
            NOW(),
            NOW()
        ),
        (
            uuid_generate_v4(),
            'Tech Startup Inc',
            'Sarah Johnson',
            'sarah@techstartup.com',
            '+1-555-0456',
            '456 Innovation Ave, San Francisco, CA 94102',
            '456 Innovation Ave, San Francisco, CA 94102',
            (SELECT id FROM first_salesperson),
            NOW(),
            NOW()
        ),
        (
            uuid_generate_v4(),
            'Global Enterprises Ltd',
            'Michael Chen',
            'michael@globalent.com',
            '+1-555-0789',
            '789 Corporate Blvd, Chicago, IL 60601',
            '789 Corporate Blvd, Chicago, IL 60601',
            (SELECT id FROM first_salesperson),
            NOW(),
            NOW()
        ),
        (
            uuid_generate_v4(),
            'Creative Studios Co',
            'Emily Rodriguez',
            'emily@creativestudios.com',
            '+1-555-0321',
            '321 Design District, Austin, TX 78701',
            '321 Design District, Austin, TX 78701',
            (SELECT id FROM first_salesperson),
            NOW(),
            NOW()
        ),
        (
            uuid_generate_v4(),
            'Manufacturing Solutions Inc',
            'David Kim',
            'david@mfgsolutions.com',
            '+1-555-0654',
            '654 Industrial Way, Detroit, MI 48201',
            '654 Industrial Way, Detroit, MI 48201',
            (SELECT id FROM first_salesperson),
            NOW(),
            NOW()
        ),
        (
            uuid_generate_v4(),
            'Retail Chain Corp',
            'Lisa Wang',
            'lisa@retailchain.com',
            '+1-555-0987',
            '987 Commerce Center, Miami, FL 33101',
            '987 Commerce Center, Miami, FL 33101',
            (SELECT id FROM first_salesperson),
            NOW(),
            NOW()
        ),
        (
            uuid_generate_v4(),
            'Healthcare Partners LLC',
            'Dr. James Wilson',
            'james@healthpartners.com',
            '+1-555-0147',
            '147 Medical Plaza, Seattle, WA 98101',
            '147 Medical Plaza, Seattle, WA 98101',
            (SELECT id FROM first_salesperson),
            NOW(),
            NOW()
        ),
        (
            uuid_generate_v4(),
            'Education Solutions Group',
            'Maria Garcia',
            'maria@edusolutions.com',
            '+1-555-0258',
            '258 Campus Drive, Denver, CO 80202',
            '258 Campus Drive, Denver, CO 80202',
            (SELECT id FROM first_salesperson),
            NOW(),
            NOW()
        )
) AS customer_data(id, name, contact_person, email, phone, shipping_address, billing_address, created_by, created_at, updated_at)
WHERE NOT EXISTS (
    -- Prevent duplicates
    SELECT 1 FROM customers c
    WHERE c.email = customer_data.email
    AND c.created_by = customer_data.created_by
);

-- Display summary
DO $$
DECLARE
    customer_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO customer_count FROM customers;
    RAISE NOTICE 'Customer seeding completed. Total customers: %', customer_count;
END $$;