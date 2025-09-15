-- Add soft delete columns
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE sale_orders ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;

-- Create indexes for soft delete queries
CREATE INDEX idx_products_deleted_at ON products(deleted_at);
CREATE INDEX idx_sale_orders_deleted_at ON sale_orders(deleted_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Create function to handle stock deduction on order fulfillment
CREATE OR REPLACE FUNCTION handle_order_fulfillment()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when order status changes to 'fulfilled'
    IF OLD.status != 'fulfilled' AND NEW.status = 'fulfilled' THEN
        -- Deduct stock for all order items
        UPDATE products
        SET stock_quantity = stock_quantity - order_items.quantity,
            updated_at = NOW()
        FROM order_items
        WHERE products.id = order_items.product_id
        AND order_items.order_id = NEW.id
        AND products.deleted_at IS NULL;

        -- Update order items stock status
        UPDATE order_items
        SET is_in_stock = (
            SELECT CASE
                WHEN products.stock_quantity >= order_items.quantity THEN true
                ELSE false
            END
            FROM products
            WHERE products.id = order_items.product_id
        )
        WHERE order_id = NEW.id;

        -- Log the status change to history
        INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status::text, NEW.status::text, NEW.warehouse_id);
    END IF;

    -- Log any status change to history (if not already logged above)
    IF OLD.status != NEW.status AND NOT (OLD.status != 'fulfilled' AND NEW.status = 'fulfilled') THEN
        INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status::text, NEW.status::text,
                COALESCE(NEW.warehouse_id, NEW.manager_id, NEW.salesperson_id));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate stock availability on order approval
CREATE OR REPLACE FUNCTION validate_stock_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate when order status changes to 'approved'
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
        -- Check if all items have sufficient stock
        IF EXISTS (
            SELECT 1
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = NEW.id
            AND p.stock_quantity < oi.quantity
            AND p.deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'Insufficient stock for one or more items in order %', NEW.id;
        END IF;

        -- Update stock status for all order items
        UPDATE order_items
        SET is_in_stock = (
            SELECT CASE
                WHEN products.stock_quantity >= order_items.quantity THEN true
                ELSE false
            END
            FROM products
            WHERE products.id = order_items.product_id
            AND products.deleted_at IS NULL
        )
        WHERE order_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle line item fulfillment
CREATE OR REPLACE FUNCTION handle_line_item_fulfillment()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when line status changes to 'fulfilled'
    IF OLD.line_status != 'fulfilled' AND NEW.line_status = 'fulfilled' THEN
        -- Deduct stock for this specific item
        UPDATE products
        SET stock_quantity = stock_quantity - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id
        AND deleted_at IS NULL;

        -- Validate that stock didn't go negative
        IF (SELECT stock_quantity FROM products WHERE id = NEW.product_id) < 0 THEN
            RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_order_fulfillment
    BEFORE UPDATE ON sale_orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_fulfillment();

CREATE TRIGGER trigger_validate_stock_approval
    BEFORE UPDATE ON sale_orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_stock_on_approval();

CREATE TRIGGER trigger_line_item_fulfillment
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION handle_line_item_fulfillment();

-- Update RLS policies to exclude soft-deleted records
DROP POLICY "Anyone can view products" ON products;
CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT USING (deleted_at IS NULL);

DROP POLICY "Only managers can modify products" ON products;
CREATE POLICY "Only managers can modify active products" ON products
    FOR ALL USING (
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'manager'
            AND deleted_at IS NULL
        )
    );

DROP POLICY "Users can view relevant orders" ON sale_orders;
CREATE POLICY "Users can view relevant active orders" ON sale_orders
    FOR SELECT USING (
        deleted_at IS NULL AND (
            salesperson_id::text = auth.uid()::text OR
            manager_id::text = auth.uid()::text OR
            warehouse_id::text = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM users
                WHERE id::text = auth.uid()::text
                AND role IN ('manager', 'warehouse')
                AND deleted_at IS NULL
            )
        )
    );

DROP POLICY "Users can update relevant orders" ON sale_orders;
CREATE POLICY "Users can update relevant active orders" ON sale_orders
    FOR UPDATE USING (
        deleted_at IS NULL AND (
            (salesperson_id::text = auth.uid()::text AND status = 'draft') OR
            (EXISTS (
                SELECT 1 FROM users
                WHERE id::text = auth.uid()::text
                AND role IN ('manager', 'warehouse')
                AND deleted_at IS NULL
            ))
        )
    );

DROP POLICY "Users can view own profile" ON users;
CREATE POLICY "Users can view own active profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text AND deleted_at IS NULL);

DROP POLICY "Users can update own profile" ON users;
CREATE POLICY "Users can update own active profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text AND deleted_at IS NULL);

-- Add soft delete function
CREATE OR REPLACE FUNCTION soft_delete_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET deleted_at = NOW()
    WHERE id = user_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION soft_delete_product(product_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET deleted_at = NOW()
    WHERE id = product_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION soft_delete_order(order_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE sale_orders
    SET deleted_at = NOW()
    WHERE id = order_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;