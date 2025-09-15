-- Good Vitamin Company Database Seeding Scripts
-- Based on price list data from The Good Vitamin Company

-- Insert sample users
INSERT INTO users (id, email, role, name) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'sarah.johnson@thegoodvitaminco.co.nz', 'salesperson', 'Sarah Johnson'),
    ('550e8400-e29b-41d4-a716-446655440002', 'michael.chen@thegoodvitaminco.co.nz', 'manager', 'Michael Chen'),
    ('550e8400-e29b-41d4-a716-446655440003', 'emma.williams@thegoodvitaminco.co.nz', 'warehouse', 'Emma Williams'),
    ('550e8400-e29b-41d4-a716-446655440004', 'james.brown@thegoodvitaminco.co.nz', 'salesperson', 'James Brown'),
    ('550e8400-e29b-41d4-a716-446655440005', 'lisa.davis@thegoodvitaminco.co.nz', 'salesperson', 'Lisa Davis'),
    ('550e8400-e29b-41d4-a716-446655440006', 'david.wilson@thegoodvitaminco.co.nz', 'warehouse', 'David Wilson'),
    ('550e8400-e29b-41d4-a716-446655440007', 'rachel.taylor@thegoodvitaminco.co.nz', 'manager', 'Rachel Taylor'),
    ('550e8400-e29b-41d4-a716-446655440008', 'mark.anderson@thegoodvitaminco.co.nz', 'salesperson', 'Mark Anderson');

-- Insert sample products (using The Good Vitamin Company data with GST tax rate 0.15 for New Zealand)
INSERT INTO products (id, code, name, category, wholesale_price, retail_price, tax_rate, stock_quantity) VALUES
    -- Kids Products (22.99 RRP range)
    ('660e8400-e29b-41d4-a716-446655440001', 'GV011', 'KIDS GOOD MULTI 90s', 'Kids Vitamins', 13.74, 22.99, 0.15, 150),
    ('660e8400-e29b-41d4-a716-446655440002', 'GV012', 'KIDS GOOD CALCI+VITA-D 90s', 'Kids Vitamins', 13.74, 22.99, 0.15, 120),
    ('660e8400-e29b-41d4-a716-446655440003', 'GV014', 'KIDS GOOD VITA-C + ZINC 90s', 'Kids Vitamins', 13.74, 22.99, 0.15, 100),
    ('660e8400-e29b-41d4-a716-446655440004', 'GV016', 'KIDS GOOD ELDERBERRY IMMUNITY 90s', 'Kids Vitamins', 13.74, 22.99, 0.15, 80),
    ('660e8400-e29b-41d4-a716-446655440005', 'GV017', 'KIDS GOOD PROBIOTICS DIGESTIVE HEALTH 45s', 'Kids Vitamins', 13.74, 22.99, 0.15, 90),
    
    -- Value Packs (32.99 RRP range)
    ('660e8400-e29b-41d4-a716-446655440006', 'GV011V', 'VALUE PACK - KIDS GOOD MULTI 160s', 'Kids Vitamins', 20.13, 32.99, 0.15, 75),
    ('660e8400-e29b-41d4-a716-446655440007', 'GV014V', 'VALUE PACK - KIDS GOOD VITA-C + Zinc 160s', 'Kids Vitamins', 20.13, 32.99, 0.15, 60),
    ('660e8400-e29b-41d4-a716-446655440008', 'GV026V', 'VALUE PACK - GOOD APPLE CIDER VINEGAR 110s', 'Adult Vitamins', 20.13, 32.99, 0.15, 45),
    
    -- Adult Products (24.99 RRP range)
    ('660e8400-e29b-41d4-a716-446655440009', 'GV020', 'GOOD BIOTIN SKIN HAIR NAILS 60s', 'Beauty & Wellness', 14.81, 24.99, 0.15, 110),
    ('660e8400-e29b-41d4-a716-446655440010', 'GV023', 'GOOD SLEEP CHAMOMILE 60s', 'Sleep & Stress', 14.81, 24.99, 0.15, 95),
    ('660e8400-e29b-41d4-a716-446655440011', 'GV024', 'GOOD IRON + VITA-C 90s', 'Adult Vitamins', 14.81, 24.99, 0.15, 125),
    ('660e8400-e29b-41d4-a716-446655440012', 'GV034', 'GOOD MAGNESIUM MUSCLE RELAX 60s', 'Sports & Recovery', 14.81, 24.99, 0.15, 85),
    ('660e8400-e29b-41d4-a716-446655440013', 'GV028', 'GOOD TURMERIC JOINTS HEART LIVER 60s', 'Adult Vitamins', 14.81, 24.99, 0.15, 100),
    ('660e8400-e29b-41d4-a716-446655440014', 'GV027', 'GOOD PROBIOTICS DIGESTIVE HEALTH 60s', 'Digestive Health', 14.81, 24.99, 0.15, 90),
    ('660e8400-e29b-41d4-a716-446655440015', 'GV040', 'GOOD VITA-C SUGAR FREE 90s', 'Adult Vitamins', 14.81, 24.99, 0.15, 140),
    
    -- Specialty Products
    ('660e8400-e29b-41d4-a716-446655440016', 'GVD14', 'GOOD VITAL C DROPS 10ML', 'Adult Vitamins', 7.39, 12.99, 0.15, 200),
    ('660e8400-e29b-41d4-a716-446655440017', 'GVC014', 'GOOD VITA-C+ZINC CHEWS 60s', 'Adult Vitamins', 6.99, 9.99, 0.15, 130),
    
    -- Effervescent Range
    ('660e8400-e29b-41d4-a716-446655440018', 'GVE011', 'GOOD EFF. MULTI EVERYDAY WELLNESS 15s', 'Adult Vitamins', 7.39, 9.99, 0.15, 160),
    ('660e8400-e29b-41d4-a716-446655440019', 'GVE012', 'GOOD EFF. MAGNESIUM RELAX MUSCLE DE-STRESS 15s', 'Sports & Recovery', 7.39, 9.99, 0.15, 120),
    ('660e8400-e29b-41d4-a716-446655440020', 'GVE014', 'GOOD EFF. VITA-C IMMUNITY RELAX 15s', 'Adult Vitamins', 7.39, 9.99, 0.15, 180),
    
    -- Pouch Products
    ('660e8400-e29b-41d4-a716-446655440021', 'GVS023', 'GOOD SLEEP POUCH 28s', 'Sleep & Stress', 5.99, 9.99, 0.15, 80),
    ('660e8400-e29b-41d4-a716-446655440022', 'GVS026', 'GOOD BEAUTY COLLAGEN POUCH 28s', 'Beauty & Wellness', 5.99, 9.99, 0.15, 70),
    ('660e8400-e29b-41d4-a716-446655440023', 'GVS035', 'GOOD ENERGY POUCH 28s', 'Energy & Performance', 5.99, 9.99, 0.15, 90),
    
    -- Bulk/Professional Products
    ('660e8400-e29b-41d4-a716-446655440024', 'GVL011P', 'KIDS MULTI LOLLIPOP 12S X 12 PACKS', 'Kids Vitamins', 88.68, 144.00, 0.15, 25),
    ('660e8400-e29b-41d4-a716-446655440025', 'GVL011B', 'VALUE PACK KIDS MULTI LOLLILPOP 100s BOX', 'Kids Vitamins', 65.00, 100.00, 0.15, 30),
    
    -- New Products
    ('660e8400-e29b-41d4-a716-446655440026', 'GVS028', 'GOOD TRAVEL CALM 4s', 'Travel & Convenience', 2.99, 4.99, 0.15, 200),
    ('660e8400-e29b-41d4-a716-446655440027', 'SGV028', 'GOOD NIGHT OUT 5s', 'Recovery & Detox', 3.99, 5.99, 0.15, 150);

-- Insert sample sale orders
INSERT INTO sale_orders (id, customer_name, contact_person, email, shipping_address, delivery_date, status, salesperson_id, notes) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', 'Auckland Health Store', 'Tom Anderson', 'tom@aucklandhealth.co.nz', '123 Queen Street, Auckland, Auckland 1010, New Zealand', '2024-09-20', 'draft', '550e8400-e29b-41d4-a716-446655440001', 'Family vitamin starter pack for retail store'),
    ('770e8400-e29b-41d4-a716-446655440002', 'Wellness Plus Pharmacy', 'Sarah Davis', 'sarah@wellnessplus.co.nz', '456 Dominion Road, Auckland, Auckland 1024, New Zealand', '2024-09-25', 'submitted', '550e8400-e29b-41d4-a716-446655440004', 'Bulk order for pharmacy chain'),
    ('770e8400-e29b-41d4-a716-446655440003', 'Natural Health Clinic', 'Mike Brown', 'mike@naturalhealthclinic.co.nz', '789 Ponsonby Road, Auckland, Auckland 1011, New Zealand', '2024-09-30', 'approved', '550e8400-e29b-41d4-a716-446655440001', 'Professional clinic bulk order'),
    ('770e8400-e29b-41d4-a716-446655440004', 'Kids First Daycare', 'Emma Johnson', 'emma@kidsfirst.co.nz', '321 Remuera Road, Auckland, Auckland 1050, New Zealand', '2024-10-05', 'fulfilled', '550e8400-e29b-41d4-a716-446655440005', 'Kids vitamins for daycare center'),
    ('770e8400-e29b-41d4-a716-446655440005', 'Fitness Plus Gym', 'David Lee', 'david@fitnessplus.co.nz', '654 Mount Eden Road, Auckland, Auckland 1024, New Zealand', '2024-10-10', 'fulfilled', '550e8400-e29b-41d4-a716-446655440008', 'Sports nutrition supplements'),
    ('770e8400-e29b-41d4-a716-446655440006', 'Beauty Essentials Spa', 'Lisa Wilson', 'lisa@beautyessentials.co.nz', '987 Newmarket Road, Auckland, Auckland 1023, New Zealand', '2024-09-18', 'draft', '550e8400-e29b-41d4-a716-446655440005', 'Beauty and wellness products'),
    ('770e8400-e29b-41d4-a716-446655440007', 'Travel Clinic Auckland', 'Mark Taylor', 'mark@travelclinic.co.nz', '147 Karangahape Road, Auckland, Auckland 1010, New Zealand', '2024-09-22', 'submitted', '550e8400-e29b-41d4-a716-446655440008', 'Travel health supplements'),
    ('770e8400-e29b-41d4-a716-446655440008', 'Holistic Health Hub', 'Rachel Green', 'rachel@holistichub.co.nz', '258 Great North Road, Auckland, Auckland 1021, New Zealand', '2024-10-15', 'approved', '550e8400-e29b-41d4-a716-446655440001', 'Complete wellness product range');

-- Insert sample order items (using retail prices as unit_price for customer orders)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total, is_in_stock) VALUES
    -- Order 1 items (Auckland Health Store)
    ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 10, 22.99, 229.90, true),
    ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 8, 22.99, 183.92, true),
    ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440015', 12, 24.99, 299.88, true),

    -- Order 2 items (Wellness Plus Pharmacy)
    ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440006', 15, 32.99, 494.85, true),
    ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440024', 3, 144.00, 432.00, true),
    ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440011', 20, 24.99, 499.80, true),

    -- Order 3 items (Natural Health Clinic)
    ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440025', 5, 100.00, 500.00, true),
    ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440018', 25, 9.99, 249.75, true),
    ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440021', 30, 9.99, 299.70, true),

    -- Order 4 items (Kids First Daycare)
    ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', 20, 22.99, 459.80, true),
    ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 15, 22.99, 344.85, true),
    ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440016', 25, 12.99, 324.75, true),

    -- Order 5 items (Fitness Plus Gym)
    ('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440012', 18, 24.99, 449.82, true),
    ('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440019', 30, 9.99, 299.70, true),
    ('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440023', 25, 9.99, 249.75, true),

    -- Order 6 items (Beauty Essentials Spa)
    ('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440009', 12, 24.99, 299.88, true),
    ('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440022', 20, 9.99, 199.80, true),

    -- Order 7 items (Travel Clinic Auckland)
    ('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440026', 50, 4.99, 249.50, true),
    ('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440027', 30, 5.99, 179.70, true),
    ('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440020', 40, 9.99, 399.60, true),

    -- Order 8 items (Holistic Health Hub)
    ('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440013', 15, 24.99, 374.85, true),
    ('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440014', 18, 24.99, 449.82, true),
    ('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440010', 12, 24.99, 299.88, true),
    ('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440008', 8, 32.99, 263.92, true);

-- Insert sample order status history
INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by) VALUES
    ('770e8400-e29b-41d4-a716-446655440002', 'draft', 'submitted', '550e8400-e29b-41d4-a716-446655440004'),
    ('770e8400-e29b-41d4-a716-446655440003', 'draft', 'submitted', '550e8400-e29b-41d4-a716-446655440001'),
    ('770e8400-e29b-41d4-a716-446655440003', 'submitted', 'approved', '550e8400-e29b-41d4-a716-446655440002'),
    ('770e8400-e29b-41d4-a716-446655440004', 'draft', 'submitted', '550e8400-e29b-41d4-a716-446655440005'),
    ('770e8400-e29b-41d4-a716-446655440004', 'submitted', 'approved', '550e8400-e29b-41d4-a716-446655440002'),
    ('770e8400-e29b-41d4-a716-446655440004', 'approved', 'fulfilled', '550e8400-e29b-41d4-a716-446655440003'),
    ('770e8400-e29b-41d4-a716-446655440005', 'draft', 'submitted', '550e8400-e29b-41d4-a716-446655440008'),
    ('770e8400-e29b-41d4-a716-446655440005', 'submitted', 'approved', '550e8400-e29b-41d4-a716-446655440007'),
    ('770e8400-e29b-41d4-a716-446655440005', 'approved', 'fulfilled', '550e8400-e29b-41d4-a716-446655440003'),
    ('770e8400-e29b-41d4-a716-446655440007', 'draft', 'submitted', '550e8400-e29b-41d4-a716-446655440008'),
    ('770e8400-e29b-41d4-a716-446655440008', 'draft', 'submitted', '550e8400-e29b-41d4-a716-446655440001'),
    ('770e8400-e29b-41d4-a716-446655440008', 'submitted', 'approved', '550e8400-e29b-41d4-a716-446655440007');

-- Update stock quantities based on orders
UPDATE products SET stock_quantity = stock_quantity - 50 WHERE id = '660e8400-e29b-41d4-a716-446655440001'; -- Kids Multi
UPDATE products SET stock_quantity = stock_quantity - 8 WHERE id = '660e8400-e29b-41d4-a716-446655440003';  -- Kids Vita-C+Zinc
UPDATE products SET stock_quantity = stock_quantity - 15 WHERE id = '660e8400-e29b-41d4-a716-446655440004'; -- Kids Elderberry
UPDATE products SET stock_quantity = stock_quantity - 15 WHERE id = '660e8400-e29b-41d4-a716-446655440006'; -- Value Pack Kids Multi
UPDATE products SET stock_quantity = stock_quantity - 8 WHERE id = '660e8400-e29b-41d4-a716-446655440008';  -- Value Pack Apple Cider
UPDATE products SET stock_quantity = stock_quantity - 12 WHERE id = '660e8400-e29b-41d4-a716-446655440009'; -- Biotin
UPDATE products SET stock_quantity = stock_quantity - 12 WHERE id = '660e8400-e29b-41d4-a716-446655440010'; -- Sleep Chamomile
UPDATE products SET stock_quantity = stock_quantity - 20 WHERE id = '660e8400-e29b-41d4-a716-446655440011'; -- Iron+Vita-C
UPDATE products SET stock_quantity = stock_quantity - 18 WHERE id = '660e8400-e29b-41d4-a716-446655440012'; -- Magnesium Muscle Relax
UPDATE products SET stock_quantity = stock_quantity - 15 WHERE id = '660e8400-e29b-41d4-a716-446655440013'; -- Turmeric
UPDATE products SET stock_quantity = stock_quantity - 18 WHERE id = '660e8400-e29b-41d4-a716-446655440014'; -- Probiotics
UPDATE products SET stock_quantity = stock_quantity - 12 WHERE id = '660e8400-e29b-41d4-a716-446655440015'; -- Vita-C Sugar Free
UPDATE products SET stock_quantity = stock_quantity - 25 WHERE id = '660e8400-e29b-41d4-a716-446655440016'; -- Vita-C Drops
UPDATE products SET stock_quantity = stock_quantity - 25 WHERE id = '660e8400-e29b-41d4-a716-446655440018'; -- Effervescent Multi
UPDATE products SET stock_quantity = stock_quantity - 30 WHERE id = '660e8400-e29b-41d4-a716-446655440019'; -- Effervescent Magnesium
UPDATE products SET stock_quantity = stock_quantity - 40 WHERE id = '660e8400-e29b-41d4-a716-446655440020'; -- Effervescent Vita-C
UPDATE products SET stock_quantity = stock_quantity - 30 WHERE id = '660e8400-e29b-41d4-a716-446655440021'; -- Sleep Pouch
UPDATE products SET stock_quantity = stock_quantity - 20 WHERE id = '660e8400-e29b-41d4-a716-446655440022'; -- Beauty Collagen Pouch
UPDATE products SET stock_quantity = stock_quantity - 25 WHERE id = '660e8400-e29b-41d4-a716-446655440023'; -- Energy Pouch
UPDATE products SET stock_quantity = stock_quantity - 3 WHERE id = '660e8400-e29b-41d4-a716-446655440024';  -- Bulk Lollipops
UPDATE products SET stock_quantity = stock_quantity - 5 WHERE id = '660e8400-e29b-41d4-a716-446655440025';  -- Value Box Lollipops
UPDATE products SET stock_quantity = stock_quantity - 50 WHERE id = '660e8400-e29b-41d4-a716-446655440026'; -- Travel Calm
UPDATE products SET stock_quantity = stock_quantity - 30 WHERE id = '660e8400-e29b-41d4-a716-446655440027'; -- Night Out