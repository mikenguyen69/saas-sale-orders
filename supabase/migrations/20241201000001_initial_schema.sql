-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE user_role AS ENUM ('salesperson', 'manager', 'warehouse');
CREATE TYPE order_status AS ENUM ('draft', 'submitted', 'approved', 'fulfilled', 'rejected');
CREATE TYPE line_status AS ENUM ('pending', 'fulfilled', 'backordered');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR NOT NULL UNIQUE,
    role user_role NOT NULL,
    name VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    category VARCHAR,
    supplier_id UUID,
    wholesale_price DECIMAL(10, 2) NOT NULL,
    retail_price DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 4) DEFAULT 0,
    stock_quantity INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sale_orders table
CREATE TABLE sale_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR NOT NULL,
    contact_person VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    shipping_address VARCHAR,
    delivery_date DATE,
    status order_status DEFAULT 'draft',
    salesperson_id UUID NOT NULL REFERENCES users(id),
    manager_id UUID REFERENCES users(id),
    warehouse_id UUID REFERENCES users(id),
    notes VARCHAR DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES sale_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(10, 2) NOT NULL,
    is_in_stock BOOLEAN DEFAULT TRUE,
    line_status line_status DEFAULT 'pending'
);

-- Create attachments table
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES sale_orders(id) ON DELETE CASCADE,
    file_url VARCHAR NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_status_history table
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES sale_orders(id) ON DELETE CASCADE,
    previous_status VARCHAR NOT NULL,
    new_status VARCHAR NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_sale_orders_status ON sale_orders(status);
CREATE INDEX idx_sale_orders_salesperson_id ON sale_orders(salesperson_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at columns
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sale_orders_updated_at
    BEFORE UPDATE ON sale_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own record
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Everyone can view products
CREATE POLICY "Anyone can view products" ON products
    FOR SELECT USING (true);

-- Only managers can create/update/delete products
CREATE POLICY "Only managers can modify products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'manager'
        )
    );

-- Sale orders policies
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

CREATE POLICY "Salesperson can create orders" ON sale_orders
    FOR INSERT WITH CHECK (
        salesperson_id::text = auth.uid()::text AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'salesperson'
        )
    );

CREATE POLICY "Users can update relevant orders" ON sale_orders
    FOR UPDATE USING (
        (salesperson_id::text = auth.uid()::text AND status = 'draft') OR
        (EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role IN ('manager', 'warehouse')
        ))
    );

-- Order items inherit permissions from parent order
CREATE POLICY "Users can view order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sale_orders
            WHERE id = order_items.order_id
        )
    );

CREATE POLICY "Users can modify order items" ON order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sale_orders
            WHERE id = order_items.order_id
        )
    );

-- Attachments inherit permissions from parent order
CREATE POLICY "Users can view attachments" ON attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sale_orders
            WHERE id = attachments.order_id
        )
    );

CREATE POLICY "Users can manage attachments" ON attachments
    FOR ALL USING (
        uploaded_by::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM sale_orders
            WHERE id = attachments.order_id
        )
    );

-- Order status history is viewable by all authorized users
CREATE POLICY "Users can view order history" ON order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sale_orders
            WHERE id = order_status_history.order_id
        )
    );

CREATE POLICY "Users can create order history" ON order_status_history
    FOR INSERT WITH CHECK (
        changed_by::text = auth.uid()::text
    );