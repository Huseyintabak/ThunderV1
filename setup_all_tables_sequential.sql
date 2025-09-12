-- ThunderV1 - Sıralı Tablo Kurulum Scripti
-- Bu script tüm tabloları sırayla oluşturur

-- ========================================
-- 1. TEMEL TABLOLAR (Zaten mevcut olmalı)
-- ========================================

-- Hammaddeler tablosu kontrol
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hammaddeler') THEN
        RAISE NOTICE 'Hammaddeler tablosu bulunamadı!';
    ELSE
        RAISE NOTICE 'Hammaddeler tablosu mevcut.';
    END IF;
END $$;

-- ========================================
-- 2. STOK HAREKETLERİ TABLOSU
-- ========================================

-- Stok hareketleri tablosunu oluştur
CREATE TABLE IF NOT EXISTS stok_hareketleri (
    id BIGSERIAL PRIMARY KEY,
    urun_id BIGINT NOT NULL,
    urun_tipi VARCHAR(20) NOT NULL, -- 'hammadde', 'yarimamul', 'nihai'
    hareket_tipi VARCHAR(20) NOT NULL, -- 'giris', 'cikis', 'uretim', 'transfer'
    miktar INTEGER NOT NULL,
    birim_fiyat DECIMAL(10,2),
    toplam_tutar DECIMAL(12,2),
    operator VARCHAR(100),
    aciklama TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stok hareketleri index'leri
CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_urun_id ON stok_hareketleri(urun_id);
CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_tipi ON stok_hareketleri(hareket_tipi);
CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_tarih ON stok_hareketleri(created_at);

-- Stok hareketleri RLS
ALTER TABLE stok_hareketleri ENABLE ROW LEVEL SECURITY;

-- Stok hareketleri politikaları
DROP POLICY IF EXISTS "stok_hareketleri_select_policy" ON stok_hareketleri;
CREATE POLICY "stok_hareketleri_select_policy" ON stok_hareketleri
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "stok_hareketleri_insert_policy" ON stok_hareketleri;
CREATE POLICY "stok_hareketleri_insert_policy" ON stok_hareketleri
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "stok_hareketleri_update_policy" ON stok_hareketleri;
CREATE POLICY "stok_hareketleri_update_policy" ON stok_hareketleri
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "stok_hareketleri_delete_policy" ON stok_hareketleri;
CREATE POLICY "stok_hareketleri_delete_policy" ON stok_hareketleri
    FOR DELETE USING (true);

-- ========================================
-- 3. ÜRETİM AŞAMALARI TABLOLARI
-- ========================================

-- Üretim aşamaları tablosu
CREATE TABLE IF NOT EXISTS production_stages (
    id BIGSERIAL PRIMARY KEY,
    production_id BIGINT REFERENCES productions(id),
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'skipped'
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    operator VARCHAR(100),
    notes TEXT,
    quality_check_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Üretim aşama şablonları tablosu
CREATE TABLE IF NOT EXISTS production_stage_templates (
    id BIGSERIAL PRIMARY KEY,
    product_type VARCHAR(20) NOT NULL, -- 'hammadde', 'yarimamul', 'nihai'
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,
    estimated_duration INTEGER, -- dakika
    required_skills TEXT[],
    quality_check_required BOOLEAN DEFAULT false,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Üretim aşamaları RLS
ALTER TABLE production_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_stage_templates ENABLE ROW LEVEL SECURITY;

-- Üretim aşamaları politikaları
DROP POLICY IF EXISTS "production_stages_all_access" ON production_stages;
CREATE POLICY "production_stages_all_access" ON production_stages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "production_stage_templates_all_access" ON production_stage_templates;
CREATE POLICY "production_stage_templates_all_access" ON production_stage_templates FOR ALL USING (true) WITH CHECK (true);

-- Üretim aşamaları index'leri
CREATE INDEX IF NOT EXISTS idx_production_stages_production_id ON production_stages(production_id);
CREATE INDEX IF NOT EXISTS idx_production_stage_templates_product_type ON production_stage_templates(product_type);

-- ========================================
-- 4. KALİTE KONTROL TABLOLARI
-- ========================================

-- Kalite kontrol noktaları tablosu
CREATE TABLE IF NOT EXISTS quality_checkpoints (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    product_type VARCHAR(20) NOT NULL, -- 'hammadde', 'yarimamul', 'nihai'
    stage_id BIGINT REFERENCES production_stage_templates(id),
    checkpoint_type VARCHAR(30) NOT NULL, -- 'visual', 'measurement', 'test', 'inspection'
    parameters JSONB, -- Kontrol parametreleri (min, max, tolerance, etc.)
    is_mandatory BOOLEAN DEFAULT true,
    frequency VARCHAR(20) DEFAULT 'every', -- 'every', 'random', 'first', 'last'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kalite kontrol sonuçları tablosu
CREATE TABLE IF NOT EXISTS quality_checks (
    id BIGSERIAL PRIMARY KEY,
    production_id BIGINT REFERENCES productions(id) ON DELETE CASCADE,
    stage_id BIGINT REFERENCES production_stages(id) ON DELETE CASCADE,
    checkpoint_id BIGINT REFERENCES quality_checkpoints(id),
    operator VARCHAR(100) NOT NULL,
    check_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    result VARCHAR(20) NOT NULL, -- 'pass', 'fail', 'warning'
    measured_value DECIMAL(15,4),
    expected_value DECIMAL(15,4),
    tolerance_min DECIMAL(15,4),
    tolerance_max DECIMAL(15,4),
    notes TEXT,
    photos TEXT[], -- Fotoğraf URL'leri
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kalite standartları tablosu
CREATE TABLE IF NOT EXISTS quality_standards (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    product_type VARCHAR(20) NOT NULL,
    standard_type VARCHAR(30) NOT NULL, -- 'internal', 'external', 'iso', 'customer'
    parameters JSONB, -- Standart parametreleri
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kalite raporları tablosu
CREATE TABLE IF NOT EXISTS quality_reports (
    id BIGSERIAL PRIMARY KEY,
    production_id BIGINT REFERENCES productions(id) ON DELETE CASCADE,
    report_type VARCHAR(30) NOT NULL, -- 'daily', 'weekly', 'monthly', 'custom'
    report_date DATE NOT NULL,
    total_checks INTEGER DEFAULT 0,
    passed_checks INTEGER DEFAULT 0,
    failed_checks INTEGER DEFAULT 0,
    warning_checks INTEGER DEFAULT 0,
    quality_score DECIMAL(5,2), -- 0-100 arası kalite skoru
    report_data JSONB, -- Detaylı rapor verileri
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kalite kontrol RLS
ALTER TABLE quality_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_reports ENABLE ROW LEVEL SECURITY;

-- Kalite kontrol politikaları
DROP POLICY IF EXISTS "quality_checkpoints_all_access" ON quality_checkpoints;
CREATE POLICY "quality_checkpoints_all_access" ON quality_checkpoints FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "quality_checks_all_access" ON quality_checks;
CREATE POLICY "quality_checks_all_access" ON quality_checks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "quality_standards_all_access" ON quality_standards;
CREATE POLICY "quality_standards_all_access" ON quality_standards FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "quality_reports_all_access" ON quality_reports;
CREATE POLICY "quality_reports_all_access" ON quality_reports FOR ALL USING (true) WITH CHECK (true);

-- Kalite kontrol index'leri
CREATE INDEX IF NOT EXISTS idx_quality_checkpoints_product_type ON quality_checkpoints(product_type);
CREATE INDEX IF NOT EXISTS idx_quality_checks_production_id ON quality_checks(production_id);
CREATE INDEX IF NOT EXISTS idx_quality_standards_product_type ON quality_standards(product_type);
CREATE INDEX IF NOT EXISTS idx_quality_reports_production_id ON quality_reports(production_id);

-- ========================================
-- 5. ÜRETİM PLANLAMA TABLOLARI
-- ========================================

-- Üretim planları tablosu
CREATE TABLE IF NOT EXISTS production_plans (
    id BIGSERIAL PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(30) NOT NULL, -- 'weekly', 'monthly', 'custom'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'completed', 'cancelled'
    total_orders INTEGER DEFAULT 0,
    total_quantity INTEGER DEFAULT 0,
    estimated_duration INTEGER, -- dakika
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Üretim plan detayları tablosu
CREATE TABLE IF NOT EXISTS production_plan_details (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT REFERENCES production_plans(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL,
    product_type VARCHAR(20) NOT NULL, -- 'hammadde', 'yarimamul', 'nihai'
    product_name VARCHAR(200) NOT NULL,
    planned_quantity INTEGER NOT NULL,
    priority INTEGER DEFAULT 1, -- 1-5 arası öncelik
    estimated_duration INTEGER, -- dakika
    required_skills TEXT[], -- Gerekli beceriler
    machine_requirements TEXT[], -- Gerekli makineler
    material_requirements JSONB, -- Malzeme gereksinimleri
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kaynak yönetimi tablosu
CREATE TABLE IF NOT EXISTS resource_management (
    id BIGSERIAL PRIMARY KEY,
    resource_type VARCHAR(30) NOT NULL, -- 'machine', 'operator', 'material'
    resource_name VARCHAR(100) NOT NULL,
    resource_code VARCHAR(50) UNIQUE,
    capacity INTEGER, -- Makine kapasitesi, operatör sayısı, malzeme miktarı
    current_usage INTEGER DEFAULT 0,
    availability_schedule JSONB, -- Çalışma saatleri, müsaitlik durumu
    maintenance_schedule JSONB, -- Bakım programı
    cost_per_hour DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Üretim zamanlaması tablosu
CREATE TABLE IF NOT EXISTS production_scheduling (
    id BIGSERIAL PRIMARY KEY,
    plan_detail_id BIGINT REFERENCES production_plan_details(id) ON DELETE CASCADE,
    resource_id BIGINT REFERENCES resource_management(id),
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'delayed', 'cancelled'
    delay_reason TEXT,
    efficiency_score DECIMAL(5,2), -- 0-100 arası verimlilik skoru
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sipariş yönetimi tablosu
CREATE TABLE IF NOT EXISTS order_management (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_code VARCHAR(50),
    product_id BIGINT NOT NULL,
    product_type VARCHAR(20) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    order_date DATE NOT NULL,
    delivery_date DATE NOT NULL,
    priority INTEGER DEFAULT 1, -- 1-5 arası öncelik
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'in_production', 'completed', 'shipped', 'cancelled'
    special_requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kapasite planlama tablosu
CREATE TABLE IF NOT EXISTS capacity_planning (
    id BIGSERIAL PRIMARY KEY,
    resource_id BIGINT REFERENCES resource_management(id),
    plan_date DATE NOT NULL,
    available_capacity INTEGER NOT NULL,
    planned_usage INTEGER DEFAULT 0,
    actual_usage INTEGER DEFAULT 0,
    utilization_rate DECIMAL(5,2), -- 0-100 arası kullanım oranı
    efficiency_rate DECIMAL(5,2), -- 0-100 arası verimlilik oranı
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Üretim planlama RLS
ALTER TABLE production_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_plan_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_scheduling ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_planning ENABLE ROW LEVEL SECURITY;

-- Üretim planlama politikaları
DROP POLICY IF EXISTS "production_plans_all_access" ON production_plans;
CREATE POLICY "production_plans_all_access" ON production_plans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "production_plan_details_all_access" ON production_plan_details;
CREATE POLICY "production_plan_details_all_access" ON production_plan_details FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "resource_management_all_access" ON resource_management;
CREATE POLICY "resource_management_all_access" ON resource_management FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "production_scheduling_all_access" ON production_scheduling;
CREATE POLICY "production_scheduling_all_access" ON production_scheduling FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "order_management_all_access" ON order_management;
CREATE POLICY "order_management_all_access" ON order_management FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "capacity_planning_all_access" ON capacity_planning;
CREATE POLICY "capacity_planning_all_access" ON capacity_planning FOR ALL USING (true) WITH CHECK (true);

-- Üretim planlama index'leri
CREATE INDEX IF NOT EXISTS idx_production_plans_type ON production_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_production_plan_details_plan_id ON production_plan_details(plan_id);
CREATE INDEX IF NOT EXISTS idx_resource_management_type ON resource_management(resource_type);
CREATE INDEX IF NOT EXISTS idx_production_scheduling_plan_detail ON production_scheduling(plan_detail_id);
CREATE INDEX IF NOT EXISTS idx_order_management_customer ON order_management(customer_name);
CREATE INDEX IF NOT EXISTS idx_capacity_planning_resource ON capacity_planning(resource_id);

-- ========================================
-- 6. ÖRNEK VERİLER
-- ========================================

-- Örnek üretim aşama şablonları
INSERT INTO production_stage_templates (product_type, stage_name, stage_order, estimated_duration, required_skills, quality_check_required, is_mandatory)
VALUES
    ('nihai', 'Malzeme Hazırlığı', 1, 30, ARRAY['operatör'], FALSE, TRUE),
    ('nihai', 'Üretim Başlatma', 2, 15, ARRAY['operatör', 'teknisyen'], TRUE, TRUE),
    ('nihai', 'Montaj Aşaması', 3, 60, ARRAY['montajcı'], FALSE, TRUE),
    ('nihai', 'Kalite Kontrol', 4, 20, ARRAY['kalite_kontrol'], TRUE, TRUE),
    ('nihai', 'Paketleme', 5, 45, ARRAY['paketleyici'], FALSE, TRUE),
    ('nihai', 'Sevkiyat Öncesi Kontrol', 6, 10, ARRAY['depo_personeli'], TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- Örnek kalite kontrol noktaları
INSERT INTO quality_checkpoints (name, description, product_type, checkpoint_type, parameters, is_mandatory, frequency)
VALUES
('Görsel Kontrol', 'Ürün yüzeyinde çizik, leke, deformasyon kontrolü', 'nihai', 'visual', '{"check_areas": ["yuzey", "kenar", "kose"], "defects": ["cizik", "leke", "deformasyon"]}', true, 'every'),
('Boyut Kontrolü', 'Ürün boyutlarının tolerans aralığında olup olmadığının kontrolü', 'nihai', 'measurement', '{"length": {"min": 100, "max": 102, "unit": "mm"}, "width": {"min": 50, "max": 52, "unit": "mm"}, "height": {"min": 20, "max": 22, "unit": "mm"}}', true, 'every'),
('Ağırlık Kontrolü', 'Ürün ağırlığının belirlenen aralıkta olup olmadığının kontrolü', 'nihai', 'measurement', '{"weight": {"min": 500, "max": 550, "unit": "g"}}', true, 'random'),
('Fonksiyon Testi', 'Ürünün temel fonksiyonlarının çalışıp çalışmadığının testi', 'nihai', 'test', '{"test_procedures": ["acma", "kapama", "ayar"], "expected_results": ["smooth", "noise_free"]}', true, 'every'),
('Paketleme Kontrolü', 'Ürünün doğru şekilde paketlenip paketlenmediğinin kontrolü', 'nihai', 'inspection', '{"package_condition": ["intact", "labeled", "sealed"], "label_info": ["barcode", "date", "batch"]}', true, 'every')
ON CONFLICT DO NOTHING;

-- Örnek kalite standartları
INSERT INTO quality_standards (name, description, product_type, standard_type, parameters, is_active)
VALUES
('ISO 9001 Kalite Yönetim Sistemi', 'Uluslararası kalite yönetim standardı', 'nihai', 'iso', '{"standard_number": "ISO 9001:2015", "requirements": ["documentation", "process_control", "continuous_improvement"]}', true),
('Müşteri Kalite Standartları', 'Müşteri özel kalite gereksinimleri', 'nihai', 'customer', '{"customer_code": "CUST001", "special_requirements": ["color_matching", "surface_finish", "packaging"]}', true),
('İç Kalite Standartları', 'Şirket içi kalite standartları', 'nihai', 'internal', '{"defect_rate_max": 0.5, "customer_satisfaction_min": 95, "delivery_time_max": 48}', true)
ON CONFLICT DO NOTHING;

-- Örnek kaynak verileri
INSERT INTO resource_management (resource_type, resource_name, resource_code, capacity, availability_schedule, cost_per_hour, is_active)
VALUES
('machine', 'CNC Tezgah 1', 'CNC001', 8, '{"monday": {"start": "08:00", "end": "17:00"}, "tuesday": {"start": "08:00", "end": "17:00"}, "wednesday": {"start": "08:00", "end": "17:00"}, "thursday": {"start": "08:00", "end": "17:00"}, "friday": {"start": "08:00", "end": "17:00"}}', 150.00, true),
('machine', 'CNC Tezgah 2', 'CNC002', 8, '{"monday": {"start": "08:00", "end": "17:00"}, "tuesday": {"start": "08:00", "end": "17:00"}, "wednesday": {"start": "08:00", "end": "17:00"}, "thursday": {"start": "08:00", "end": "17:00"}, "friday": {"start": "08:00", "end": "17:00"}}', 150.00, true),
('machine', 'Montaj Hattı 1', 'MON001', 16, '{"monday": {"start": "08:00", "end": "17:00"}, "tuesday": {"start": "08:00", "end": "17:00"}, "wednesday": {"start": "08:00", "end": "17:00"}, "thursday": {"start": "08:00", "end": "17:00"}, "friday": {"start": "08:00", "end": "17:00"}}', 100.00, true),
('operator', 'Operatör 1', 'OP001', 1, '{"monday": {"start": "08:00", "end": "17:00"}, "tuesday": {"start": "08:00", "end": "17:00"}, "wednesday": {"start": "08:00", "end": "17:00"}, "thursday": {"start": "08:00", "end": "17:00"}, "friday": {"start": "08:00", "end": "17:00"}}', 50.00, true),
('operator', 'Operatör 2', 'OP002', 1, '{"monday": {"start": "08:00", "end": "17:00"}, "tuesday": {"start": "08:00", "end": "17:00"}, "wednesday": {"start": "08:00", "end": "17:00"}, "thursday": {"start": "08:00", "end": "17:00"}, "friday": {"start": "08:00", "end": "17:00"}}', 50.00, true),
('material', 'Çelik Levha', 'MAT001', 1000, '{"unit": "kg", "reorder_level": 100, "supplier": "Çelik A.Ş."}', 25.00, true),
('material', 'Alüminyum Profil', 'MAT002', 500, '{"unit": "m", "reorder_level": 50, "supplier": "Alüminyum Ltd."}', 15.00, true)
ON CONFLICT DO NOTHING;

-- Örnek sipariş verileri
INSERT INTO order_management (order_number, customer_name, customer_code, product_id, product_type, product_name, quantity, unit_price, total_amount, order_date, delivery_date, priority, status)
VALUES
('ORD-2025-001', 'ABC Şirketi', 'CUST001', 1, 'nihai', 'Ürün A', 100, 250.00, 25000.00, '2025-09-01', '2025-09-15', 1, 'pending'),
('ORD-2025-002', 'XYZ Ltd.', 'CUST002', 2, 'nihai', 'Ürün B', 50, 400.00, 20000.00, '2025-09-02', '2025-09-20', 2, 'pending'),
('ORD-2025-003', 'DEF A.Ş.', 'CUST003', 3, 'nihai', 'Ürün C', 75, 300.00, 22500.00, '2025-09-03', '2025-09-25', 1, 'pending')
ON CONFLICT DO NOTHING;

-- Tamamlandı mesajı
SELECT 'Tüm tablolar başarıyla oluşturuldu!' as setup_status;
