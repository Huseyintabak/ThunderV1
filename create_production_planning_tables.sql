-- Faz 3: Üretim Planlama ve Zamanlama Tabloları
-- V1.6.0 - Üretim Planlama Yönetimi

-- Üretim planları tablosu
CREATE TABLE IF NOT EXISTS production_plans (
    id BIGSERIAL PRIMARY KEY,
    plan_name VARCHAR(200) NOT NULL,
    plan_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'approved', 'active', 'completed'
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan detayları tablosu
CREATE TABLE IF NOT EXISTS production_plan_details (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT REFERENCES production_plans(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL,
    product_type VARCHAR(20) NOT NULL,
    planned_quantity INTEGER NOT NULL,
    planned_start_date DATE,
    planned_end_date DATE,
    priority INTEGER DEFAULT 1, -- 1-5 arası öncelik
    assigned_operator VARCHAR(100),
    estimated_duration INTEGER, -- dakika
    status VARCHAR(20) DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kaynak yönetimi tablosu
CREATE TABLE IF NOT EXISTS resource_management (
    id BIGSERIAL PRIMARY KEY,
    resource_name VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- 'machine', 'operator', 'tool', 'space'
    capacity INTEGER NOT NULL, -- saat/gün
    cost_per_hour DECIMAL(10,2) DEFAULT 0.00,
    skills_required TEXT[],
    is_active BOOLEAN DEFAULT true,
    location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Üretim zamanlaması tablosu
CREATE TABLE IF NOT EXISTS production_scheduling (
    id BIGSERIAL PRIMARY KEY,
    plan_detail_id BIGINT REFERENCES production_plan_details(id) ON DELETE CASCADE,
    resource_id BIGINT REFERENCES resource_management(id) ON DELETE CASCADE,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'delayed'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sipariş yönetimi tablosu
CREATE TABLE IF NOT EXISTS order_management (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_contact VARCHAR(200),
    order_date DATE NOT NULL,
    delivery_date DATE NOT NULL,
    priority INTEGER DEFAULT 1, -- 1-5 arası öncelik
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'in_production', 'completed', 'cancelled'
    total_amount DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sipariş detayları tablosu
CREATE TABLE IF NOT EXISTS order_details (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES order_management(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL,
    product_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kapasite planlama tablosu
CREATE TABLE IF NOT EXISTS capacity_planning (
    id BIGSERIAL PRIMARY KEY,
    resource_id BIGINT REFERENCES resource_management(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    available_hours INTEGER NOT NULL,
    booked_hours INTEGER DEFAULT 0,
    maintenance_hours INTEGER DEFAULT 0,
    efficiency_rate DECIMAL(5,2) DEFAULT 100.00, -- yüzde
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_production_plans_status ON production_plans(status);
CREATE INDEX IF NOT EXISTS idx_production_plans_dates ON production_plans(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_production_plan_details_plan_id ON production_plan_details(plan_id);
CREATE INDEX IF NOT EXISTS idx_production_plan_details_product ON production_plan_details(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_production_plan_details_dates ON production_plan_details(planned_start_date, planned_end_date);
CREATE INDEX IF NOT EXISTS idx_resource_management_type ON resource_management(resource_type);
CREATE INDEX IF NOT EXISTS idx_resource_management_active ON resource_management(is_active);
CREATE INDEX IF NOT EXISTS idx_production_scheduling_dates ON production_scheduling(scheduled_start, scheduled_end);
CREATE INDEX IF NOT EXISTS idx_order_management_status ON order_management(status);
CREATE INDEX IF NOT EXISTS idx_order_management_dates ON order_management(order_date, delivery_date);
CREATE INDEX IF NOT EXISTS idx_capacity_planning_date ON capacity_planning(plan_date);

-- RLS (Row Level Security) politikaları
ALTER TABLE production_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_plan_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_scheduling ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_planning ENABLE ROW LEVEL SECURITY;

-- Production plans RLS politikaları
CREATE POLICY IF NOT EXISTS "production_plans_select_policy" ON production_plans
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "production_plans_insert_policy" ON production_plans
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "production_plans_update_policy" ON production_plans
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "production_plans_delete_policy" ON production_plans
    FOR DELETE USING (true);

-- Production plan details RLS politikaları
CREATE POLICY IF NOT EXISTS "production_plan_details_select_policy" ON production_plan_details
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "production_plan_details_insert_policy" ON production_plan_details
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "production_plan_details_update_policy" ON production_plan_details
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "production_plan_details_delete_policy" ON production_plan_details
    FOR DELETE USING (true);

-- Resource management RLS politikaları
CREATE POLICY IF NOT EXISTS "resource_management_select_policy" ON resource_management
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "resource_management_insert_policy" ON resource_management
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "resource_management_update_policy" ON resource_management
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "resource_management_delete_policy" ON resource_management
    FOR DELETE USING (true);

-- Production scheduling RLS politikaları
CREATE POLICY IF NOT EXISTS "production_scheduling_select_policy" ON production_scheduling
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "production_scheduling_insert_policy" ON production_scheduling
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "production_scheduling_update_policy" ON production_scheduling
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "production_scheduling_delete_policy" ON production_scheduling
    FOR DELETE USING (true);

-- Order management RLS politikaları
CREATE POLICY IF NOT EXISTS "order_management_select_policy" ON order_management
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "order_management_insert_policy" ON order_management
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "order_management_update_policy" ON order_management
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "order_management_delete_policy" ON order_management
    FOR DELETE USING (true);

-- Order details RLS politikaları
CREATE POLICY IF NOT EXISTS "order_details_select_policy" ON order_details
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "order_details_insert_policy" ON order_details
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "order_details_update_policy" ON order_details
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "order_details_delete_policy" ON order_details
    FOR DELETE USING (true);

-- Capacity planning RLS politikaları
CREATE POLICY IF NOT EXISTS "capacity_planning_select_policy" ON capacity_planning
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "capacity_planning_insert_policy" ON capacity_planning
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "capacity_planning_update_policy" ON capacity_planning
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "capacity_planning_delete_policy" ON capacity_planning
    FOR DELETE USING (true);

-- Trigger'lar - updated_at otomatik güncelleme
CREATE TRIGGER update_production_plans_updated_at 
    BEFORE UPDATE ON production_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_plan_details_updated_at 
    BEFORE UPDATE ON production_plan_details 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_management_updated_at 
    BEFORE UPDATE ON resource_management 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_scheduling_updated_at 
    BEFORE UPDATE ON production_scheduling 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_management_updated_at 
    BEFORE UPDATE ON order_management 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capacity_planning_updated_at 
    BEFORE UPDATE ON capacity_planning 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Örnek kaynaklar
INSERT INTO resource_management (resource_name, resource_type, capacity, cost_per_hour, skills_required, is_active, location) VALUES
('Montaj Hattı 1', 'machine', 8, 50.00, ARRAY['montaj', 'kalite_kontrol'], true, 'Üretim Salonu A'),
('Montaj Hattı 2', 'machine', 8, 50.00, ARRAY['montaj', 'kalite_kontrol'], true, 'Üretim Salonu A'),
('Kalite Kontrol İstasyonu', 'machine', 8, 30.00, ARRAY['kalite_kontrol', 'ölçüm'], true, 'Kalite Laboratuvarı'),
('Operatör 1 - Ahmet Yılmaz', 'operator', 8, 25.00, ARRAY['montaj', 'paketleme'], true, 'Üretim Salonu A'),
('Operatör 2 - Fatma Demir', 'operator', 8, 25.00, ARRAY['kalite_kontrol', 'test'], true, 'Kalite Laboratuvarı'),
('Operatör 3 - Mehmet Kaya', 'operator', 8, 25.00, ARRAY['montaj', 'bakım'], true, 'Üretim Salonu B'),
('Paketleme İstasyonu', 'machine', 8, 20.00, ARRAY['paketleme', 'etiketleme'], true, 'Sevkiyat Alanı');

-- Örnek üretim planı
INSERT INTO production_plans (plan_name, plan_type, start_date, end_date, status, created_by, notes) VALUES
('V1.6.0 Test Planı', 'daily', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'active', 'test_user', 'Faz 3 test planı');

-- Başarı mesajı
SELECT 'Üretim planlama tabloları başarıyla oluşturuldu!' as message;