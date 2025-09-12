-- Faz 2: Kalite Kontrol Sistemi Tabloları
-- V1.6.0 - Kalite Kontrol Yönetimi

-- Kalite kontrol noktaları tablosu
CREATE TABLE IF NOT EXISTS quality_checkpoints (
    id BIGSERIAL PRIMARY KEY,
    production_id BIGINT REFERENCES productions(id) ON DELETE CASCADE,
    stage_id BIGINT REFERENCES production_stages(id) ON DELETE CASCADE,
    checkpoint_name VARCHAR(100) NOT NULL,
    checkpoint_type VARCHAR(50) NOT NULL, -- 'visual', 'measurement', 'test'
    criteria JSONB NOT NULL, -- Kontrol kriterleri
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'pass', 'fail', 'retest'
    checked_by VARCHAR(100),
    check_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    photos TEXT[], -- Fotoğraf URL'leri
    measurements JSONB, -- Ölçüm değerleri
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kalite kontrol şablonları tablosu
CREATE TABLE IF NOT EXISTS quality_templates (
    id BIGSERIAL PRIMARY KEY,
    product_type VARCHAR(20) NOT NULL,
    stage_name VARCHAR(100) NOT NULL,
    checkpoint_name VARCHAR(100) NOT NULL,
    checkpoint_type VARCHAR(50) NOT NULL,
    criteria JSONB NOT NULL,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kalite standartları tablosu
CREATE TABLE IF NOT EXISTS quality_standards (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    product_type VARCHAR(20) NOT NULL,
    standard_type VARCHAR(50) NOT NULL, -- 'iso', 'internal', 'customer'
    version VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kalite kontrolleri tablosu
CREATE TABLE IF NOT EXISTS quality_checks (
    id BIGSERIAL PRIMARY KEY,
    production_id BIGINT REFERENCES productions(id) ON DELETE CASCADE,
    stage_id BIGINT REFERENCES production_stages(id) ON DELETE CASCADE,
    checkpoint_id BIGINT REFERENCES quality_checkpoints(id) ON DELETE CASCADE,
    operator VARCHAR(100) NOT NULL,
    result VARCHAR(20) NOT NULL, -- 'pass', 'fail', 'warning'
    measured_value DECIMAL(15,4),
    expected_value DECIMAL(15,4),
    tolerance_min DECIMAL(15,4),
    tolerance_max DECIMAL(15,4),
    notes TEXT,
    photos TEXT[],
    check_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kalite raporları tablosu
CREATE TABLE IF NOT EXISTS quality_reports (
    id BIGSERIAL PRIMARY KEY,
    production_id BIGINT REFERENCES productions(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'production'
    report_date DATE NOT NULL,
    total_checks INTEGER DEFAULT 0,
    passed_checks INTEGER DEFAULT 0,
    failed_checks INTEGER DEFAULT 0,
    warning_checks INTEGER DEFAULT 0,
    quality_score DECIMAL(5,2) DEFAULT 0.00,
    report_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_quality_checkpoints_production_id ON quality_checkpoints(production_id);
CREATE INDEX IF NOT EXISTS idx_quality_checkpoints_stage_id ON quality_checkpoints(stage_id);
CREATE INDEX IF NOT EXISTS idx_quality_checkpoints_status ON quality_checkpoints(status);
CREATE INDEX IF NOT EXISTS idx_quality_templates_product_type ON quality_templates(product_type);
CREATE INDEX IF NOT EXISTS idx_quality_checks_production_id ON quality_checks(production_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_result ON quality_checks(result);
CREATE INDEX IF NOT EXISTS idx_quality_reports_production_id ON quality_reports(production_id);
CREATE INDEX IF NOT EXISTS idx_quality_reports_report_date ON quality_reports(report_date);

-- RLS (Row Level Security) politikaları
ALTER TABLE quality_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_reports ENABLE ROW LEVEL SECURITY;

-- Quality checkpoints RLS politikaları
CREATE POLICY IF NOT EXISTS "quality_checkpoints_select_policy" ON quality_checkpoints
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "quality_checkpoints_insert_policy" ON quality_checkpoints
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "quality_checkpoints_update_policy" ON quality_checkpoints
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "quality_checkpoints_delete_policy" ON quality_checkpoints
    FOR DELETE USING (true);

-- Quality templates RLS politikaları
CREATE POLICY IF NOT EXISTS "quality_templates_select_policy" ON quality_templates
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "quality_templates_insert_policy" ON quality_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "quality_templates_update_policy" ON quality_templates
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "quality_templates_delete_policy" ON quality_templates
    FOR DELETE USING (true);

-- Quality standards RLS politikaları
CREATE POLICY IF NOT EXISTS "quality_standards_select_policy" ON quality_standards
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "quality_standards_insert_policy" ON quality_standards
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "quality_standards_update_policy" ON quality_standards
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "quality_standards_delete_policy" ON quality_standards
    FOR DELETE USING (true);

-- Quality checks RLS politikaları
CREATE POLICY IF NOT EXISTS "quality_checks_select_policy" ON quality_checks
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "quality_checks_insert_policy" ON quality_checks
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "quality_checks_update_policy" ON quality_checks
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "quality_checks_delete_policy" ON quality_checks
    FOR DELETE USING (true);

-- Quality reports RLS politikaları
CREATE POLICY IF NOT EXISTS "quality_reports_select_policy" ON quality_reports
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "quality_reports_insert_policy" ON quality_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "quality_reports_update_policy" ON quality_reports
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "quality_reports_delete_policy" ON quality_reports
    FOR DELETE USING (true);

-- Trigger'lar - updated_at otomatik güncelleme
CREATE TRIGGER update_quality_checkpoints_updated_at 
    BEFORE UPDATE ON quality_checkpoints 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Örnek kalite şablonları
INSERT INTO quality_templates (product_type, stage_name, checkpoint_name, checkpoint_type, criteria, is_mandatory) VALUES
('nihai', 'Malzeme Hazırlığı', 'Malzeme Kalitesi Kontrolü', 'visual', '{"check_items": ["yüzey_durumu", "renk_tutarlılığı", "hasar_kontrolü"], "pass_criteria": "Tüm öğeler uygun"}', true),
('nihai', 'Malzeme Hazırlığı', 'Boyut Kontrolü', 'measurement', '{"tolerance": 0.1, "unit": "mm", "min_value": 95, "max_value": 105}', true),
('nihai', 'Montaj', 'Montaj Kalitesi', 'visual', '{"check_items": ["vida_sıkılığı", "hizalama", "temizlik"], "pass_criteria": "Tüm öğeler uygun"}', true),
('nihai', 'Montaj', 'Fonksiyon Testi', 'test', '{"test_procedure": "Manuel test", "expected_result": "Çalışır durumda", "test_duration": 5}', true),
('nihai', 'Kalite Kontrol', 'Final Kontrol', 'visual', '{"check_items": ["genel_görünüm", "etiketleme", "paketleme"], "pass_criteria": "Müşteri standartlarına uygun"}', true),

('yarimamul', 'Hammadde Kontrolü', 'Malzeme Uygunluk', 'visual', '{"check_items": ["kalite_sertifikası", "parti_numarası", "son_kullanma"], "pass_criteria": "Tüm belgeler mevcut"}', true),
('yarimamul', 'İşleme', 'İşleme Kalitesi', 'measurement', '{"tolerance": 0.05, "unit": "mm", "critical_dimensions": ["uzunluk", "genişlik", "yükseklik"]}', true),
('yarimamul', 'Ara Kalite Kontrol', 'Ara Kontrol', 'visual', '{"check_items": ["yüzey_kalitesi", "boyut_doğruluğu", "işleme_hataları"], "pass_criteria": "Kabul edilebilir seviyede"}', true);

-- Örnek kalite standartları
INSERT INTO quality_standards (name, description, product_type, standard_type, version, is_active) VALUES
('ISO 9001:2015', 'Kalite Yönetim Sistemi', 'nihai', 'iso', '2015', true),
('ISO 14001:2015', 'Çevre Yönetim Sistemi', 'nihai', 'iso', '2015', true),
('İç Kalite Standardı', 'Şirket içi kalite standartları', 'nihai', 'internal', 'v2.1', true),
('Müşteri Kalite Şartnamesi', 'Özel müşteri gereksinimleri', 'nihai', 'customer', 'v1.0', true);

-- Başarı mesajı
SELECT 'Kalite kontrol tabloları başarıyla oluşturuldu!' as message;