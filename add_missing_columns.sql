-- Production Plans tablosuna eksik sütunları ekle
ALTER TABLE production_plans 
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS working_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_capacity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS assigned_operator VARCHAR(100),
ADD COLUMN IF NOT EXISTS operator_notes TEXT;

-- Order Management tablosuna eksik sütunları ekle
ALTER TABLE order_management 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS product_details JSONB,
ADD COLUMN IF NOT EXISTS assigned_operator VARCHAR(100),
ADD COLUMN IF NOT EXISTS operator_notes TEXT;

-- Sütunları güncelle
UPDATE production_plans 
SET total_orders = 0, total_quantity = 0, working_days = 0, total_capacity = 0 
WHERE total_orders IS NULL OR total_quantity IS NULL OR working_days IS NULL OR total_capacity IS NULL;

-- Index'leri ekle
CREATE INDEX IF NOT EXISTS idx_production_plans_total_orders ON production_plans(total_orders);
CREATE INDEX IF NOT EXISTS idx_production_plans_total_quantity ON production_plans(total_quantity);
CREATE INDEX IF NOT EXISTS idx_order_management_quantity ON order_management(quantity);
