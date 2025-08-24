-- Judy's Cafe Database Schema for Supabase
-- Run this SQL in your Supabase SQL editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
CREATE POLICY "Enable all access for authenticated users" ON auth.users FOR ALL USING (auth.role() = 'authenticated');

-- Branches table
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  manager TEXT NOT NULL,
  opening_hours TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
  total_sales DECIMAL(10,2) DEFAULT 0,
  daily_sales DECIMAL(10,2) DEFAULT 0,
  employees INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT CHECK (role IN ('admin', 'manager', 'cashier')) NOT NULL,
  branch_id UUID REFERENCES branches(id),
  accessible_branches UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  description TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  payment_terms TEXT,
  lead_time_days INTEGER DEFAULT 7,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_orders INTEGER DEFAULT 0,
  on_time_deliveries INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_threshold INTEGER NOT NULL DEFAULT 10,
  max_threshold INTEGER NOT NULL DEFAULT 100,
  unit TEXT NOT NULL,
  cost_price DECIMAL(8,2) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  barcode TEXT,
  expiry_date DATE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  tip DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'mobile')) NOT NULL,
  order_type TEXT CHECK (order_type IN ('dine-in', 'takeout', 'delivery')) NOT NULL,
  cashier_name TEXT NOT NULL,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('completed', 'refunded', 'void')) DEFAULT 'completed',
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction items table
CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(8,2) NOT NULL,
  subtotal DECIMAL(8,2) NOT NULL,
  modifications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  position TEXT NOT NULL,
  department TEXT,
  hourly_rate DECIMAL(8,2),
  hire_date DATE DEFAULT CURRENT_DATE,
  status TEXT CHECK (status IN ('active', 'inactive', 'terminated')) DEFAULT 'active',
  address TEXT,
  emergency_contact JSONB,
  availability JSONB,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  loyalty_card JSONB,
  preferences JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  status TEXT CHECK (status IN ('draft', 'pending', 'approved', 'ordered', 'delivered', 'cancelled')) DEFAULT 'draft',
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT NOT NULL,
  approved_by TEXT,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase order items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(8,2) NOT NULL,
  total_cost DECIMAL(8,2) NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);
CREATE INDEX IF NOT EXISTS idx_products_branch_id ON products(branch_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON inventory_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_transactions_branch_id ON transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_customers_branch_id ON customers(branch_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch_id ON purchase_orders(branch_id);

-- Enable Row Level Security (RLS)
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - you may want to customize based on your requirements)
-- Allow authenticated users to read all branches
CREATE POLICY "Allow authenticated users to read branches" ON branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to update branches" ON branches FOR UPDATE TO authenticated USING (true);

-- Users can read their own data and admins can read all
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow authenticated users to insert users" ON users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update users" ON users FOR UPDATE TO authenticated USING (true);

-- Products policies - branch-aware
CREATE POLICY "Allow authenticated users to read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update products" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete products" ON products FOR DELETE TO authenticated USING (true);

-- Similar policies for other tables (customize as needed)
CREATE POLICY "Allow authenticated users full access to suppliers" ON suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to inventory_items" ON inventory_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to transactions" ON transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to transaction_items" ON transaction_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to employees" ON employees FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to customers" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to purchase_orders" ON purchase_orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to purchase_order_items" ON purchase_order_items FOR ALL TO authenticated USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development (optional)
-- Sample branches
INSERT INTO branches (id, name, address, phone, email, manager, opening_hours) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Judy''s Cafe Downtown', '123 Main St, Downtown', '+1-555-0101', 'downtown@judyscafe.com', 'Alice Johnson', '6:00 AM - 10:00 PM'),
('550e8400-e29b-41d4-a716-446655440002', 'Judy''s Cafe Westside', '456 Oak Ave, Westside', '+1-555-0102', 'westside@judyscafe.com', 'Bob Smith', '7:00 AM - 9:00 PM'),
('550e8400-e29b-41d4-a716-446655440003', 'Judy''s Cafe Airport', '789 Airport Blvd, Terminal 1', '+1-555-0103', 'airport@judyscafe.com', 'Carol Davis', '5:00 AM - 11:00 PM')
ON CONFLICT (id) DO NOTHING;

-- Note: You'll need to manually create auth users in Supabase Auth dashboard and then insert corresponding user records