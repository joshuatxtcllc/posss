/*
  # Custom Framing POS Database Schema

  1. New Tables
    - `customers`: Customer information with contact details and preferences
    - `orders`: Comprehensive order management with pricing breakdown
    - `materials`: Inventory management for frames, mats, glass, and backing
    - `order_materials`: Junction table linking orders to materials used
    - `payments`: Payment tracking with multiple payment methods
    - `notifications`: Customer communication tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage data

  3. Features
    - Complete pricing breakdown
    - Material inventory tracking
    - Order status workflow
    - Payment processing
    - Customer communication
*/

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  notes text,
  preferred_contact text DEFAULT 'email',
  total_orders integer DEFAULT 0,
  total_spent decimal(10,2) DEFAULT 0.00,
  last_order_date timestamp with time zone,
  loyalty_points integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true);

-- Orders table with comprehensive framing details
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  order_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'quote',
  priority text DEFAULT 'standard',
  
  -- Artwork specifications
  artwork_description text,
  image_width decimal(8,2),
  image_height decimal(8,2),
  mat_width decimal(8,2),
  mat_height decimal(8,2),
  
  -- Materials
  frame_style text,
  mat_type text,
  glass_type text,
  backing_type text,
  complexity text DEFAULT 'medium',
  
  -- Pricing breakdown
  base_price decimal(10,2),
  frame_price decimal(10,2),
  mat_price decimal(10,2),
  glass_price decimal(10,2),
  backing_price decimal(10,2),
  labor_price decimal(10,2),
  rush_fee decimal(10,2) DEFAULT 0.00,
  subtotal decimal(10,2),
  tax decimal(10,2),
  total decimal(10,2) NOT NULL,
  
  -- Payment tracking
  amount_paid decimal(10,2) DEFAULT 0.00,
  payment_status text DEFAULT 'unpaid',
  
  -- Dates and tracking
  estimated_completion timestamp with time zone,
  actual_completion timestamp with time zone,
  last_status_update timestamp with time zone DEFAULT now(),
  
  -- Additional data
  special_instructions text,
  internal_notes text,
  image_urls jsonb,
  ai_recommendations jsonb,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (true);

-- Materials inventory table
CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  sku text UNIQUE,
  supplier text,
  current_stock integer DEFAULT 0,
  min_stock integer DEFAULT 5,
  max_stock integer DEFAULT 100,
  unit_cost decimal(10,2),
  unit_price decimal(10,2),
  unit text DEFAULT 'each',
  specifications jsonb,
  is_active boolean DEFAULT true,
  last_restocked timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage materials"
  ON materials
  FOR ALL
  TO authenticated
  USING (true);

-- Order materials junction table
CREATE TABLE IF NOT EXISTS order_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) NOT NULL,
  material_id uuid REFERENCES materials(id) NOT NULL,
  quantity_needed decimal(10,3) NOT NULL,
  quantity_used decimal(10,3) DEFAULT 0,
  unit_cost decimal(10,2),
  total_cost decimal(10,2),
  status text DEFAULT 'needed',
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE order_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage order materials"
  ON order_materials
  FOR ALL
  TO authenticated
  USING (true);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) NOT NULL,
  amount decimal(10,2) NOT NULL,
  method text NOT NULL,
  status text DEFAULT 'completed',
  transaction_id text,
  processor_response jsonb,
  refunded_amount decimal(10,2) DEFAULT 0.00,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (true);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  customer_id uuid REFERENCES customers(id),
  type text NOT NULL,
  subject text,
  message text NOT NULL,
  status text DEFAULT 'pending',
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  error_message text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (true);

-- Insert sample materials for immediate use
INSERT INTO materials (category, name, sku, unit_cost, unit_price, unit, specifications) VALUES
-- Frame styles
('frames', 'Classic Oak Frame', 'FRAME-OAK-001', 15.00, 28.50, 'linear_foot', '{"width": "1.5", "profile": "traditional", "finish": "natural"}'),
('frames', 'Modern Metal Frame', 'FRAME-MTL-001', 18.00, 35.00, 'linear_foot', '{"width": "1.0", "profile": "contemporary", "finish": "matte_black"}'),
('frames', 'Premium Gold Frame', 'FRAME-GLD-001', 25.00, 45.00, 'linear_foot', '{"width": "2.0", "profile": "ornate", "finish": "antique_gold"}'),
('frames', 'Rustic Pine Frame', 'FRAME-PIN-001', 12.00, 32.00, 'linear_foot', '{"width": "1.75", "profile": "rustic", "finish": "distressed"}'),
('frames', 'Elegant Silver Frame', 'FRAME-SLV-001', 20.00, 38.00, 'linear_foot', '{"width": "1.25", "profile": "elegant", "finish": "brushed_silver"}'),

-- Mat boards
('mats', 'White Core Mat', 'MAT-WHT-001', 8.00, 15.00, 'square_foot', '{"color": "white", "core": "white", "thickness": "4_ply"}'),
('mats', 'Cream Core Mat', 'MAT-CRM-001', 8.00, 15.00, 'square_foot', '{"color": "cream", "core": "cream", "thickness": "4_ply"}'),
('mats', 'Black Core Mat', 'MAT-BLK-001', 10.00, 18.00, 'square_foot', '{"color": "black", "core": "black", "thickness": "4_ply"}'),
('mats', 'Double Mat Special', 'MAT-DBL-001', 15.00, 25.00, 'square_foot', '{"type": "double", "colors": "custom", "thickness": "8_ply"}'),
('mats', 'Conservation Mat', 'MAT-CON-001', 12.00, 22.00, 'square_foot', '{"type": "conservation", "acid_free": true, "lignin_free": true}'),

-- Glass types
('glass', 'Regular Glass', 'GLS-REG-001', 6.00, 12.00, 'square_foot', '{"type": "regular", "thickness": "2mm", "uv_protection": false}'),
('glass', 'UV Protection Glass', 'GLS-UV-001', 12.00, 25.00, 'square_foot', '{"type": "uv_protection", "thickness": "2mm", "uv_protection": true}'),
('glass', 'Museum Quality Glass', 'GLS-MUS-001', 25.00, 45.00, 'square_foot', '{"type": "museum", "thickness": "2mm", "uv_protection": true, "anti_reflective": true}'),
('glass', 'Anti-Glare Glass', 'GLS-AG-001', 15.00, 30.00, 'square_foot', '{"type": "anti_glare", "thickness": "2mm", "uv_protection": false}'),

-- Backing materials
('backing', 'Standard Backing', 'BCK-STD-001', 3.00, 8.00, 'square_foot', '{"type": "standard", "material": "corrugated"}'),
('backing', 'Archival Backing', 'BCK-ARC-001', 6.00, 12.00, 'square_foot', '{"type": "archival", "material": "acid_free", "ph_neutral": true}'),
('backing', 'Foam Core Backing', 'BCK-FCR-001', 4.00, 10.00, 'square_foot', '{"type": "foam_core", "thickness": "3/16", "acid_free": true}')

ON CONFLICT (sku) DO NOTHING;