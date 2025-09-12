-- Faz 1: Üretim Aşamaları Yönetimi Tabloları
-- V1.6.0 - Üretim Süreç Yönetimi

-- Üretim aşamaları tablosu
CREATE TABLE IF NOT EXISTS production_stages (
    id BIGSERIAL PRIMARY KEY,
    production_id BIGINT REFERENCES productions(id) ON DELETE CASCADE,
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'skipped'
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    operator VARCHAR(100),
    notes TEXT,
    quality_check_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Üretim aşama şablonları tablosu
CREATE TABLE IF NOT EXISTS production_stage_templates (
    id BIGSERIAL PRIMARY KEY,
    product_type VARCHAR(20) NOT NULL,
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,
    estimated_duration INTEGER, -- dakika
    required_skills TEXT[],
    quality_check_required BOOLEAN DEFAULT false,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_production_stages_production_id ON production_stages(production_id);
CREATE INDEX IF NOT EXISTS idx_production_stages_status ON production_stages(status);
CREATE INDEX IF NOT EXISTS idx_production_stages_stage_order ON production_stages(stage_order);
CREATE INDEX IF NOT EXISTS idx_production_stage_templates_product_type ON production_stage_templates(product_type);
CREATE INDEX IF NOT EXISTS idx_production_stage_templates_stage_order ON production_stage_templates(stage_order);

-- RLS (Row Level Security) politikaları
ALTER TABLE production_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_stage_templates ENABLE ROW LEVEL SECURITY;

-- Production stages RLS politikaları
CREATE POLICY IF NOT EXISTS "production_stages_select_policy" ON production_stages
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "production_stages_insert_policy" ON production_stages
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "production_stages_update_policy" ON production_stages
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "production_stages_delete_policy" ON production_stages
    FOR DELETE USING (true);

-- Production stage templates RLS politikaları
CREATE POLICY IF NOT EXISTS "production_stage_templates_select_policy" ON production_stage_templates
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "production_stage_templates_insert_policy" ON production_stage_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "production_stage_templates_update_policy" ON production_stage_templates
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "production_stage_templates_delete_policy" ON production_stage_templates
    FOR DELETE USING (true);

-- Trigger'lar - updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_production_stages_updated_at 
    BEFORE UPDATE ON production_stages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Örnek aşama şablonları
INSERT INTO production_stage_templates (product_type, stage_name, stage_order, estimated_duration, required_skills, quality_check_required, is_mandatory) VALUES
('nihai', 'Malzeme Hazırlığı', 1, 30, ARRAY['operatör', 'malzeme_uzmanı'], true, true),
('nihai', 'Montaj', 2, 120, ARRAY['montaj_operatörü'], true, true),
('nihai', 'Kalite Kontrol', 3, 15, ARRAY['kalite_kontrol'], true, true),
('nihai', 'Paketleme', 4, 20, ARRAY['paketleme_operatörü'], false, true),
('nihai', 'Sevkiyat Hazırlığı', 5, 10, ARRAY['sevkiyat_operatörü'], false, false),

('yarimamul', 'Hammadde Kontrolü', 1, 15, ARRAY['kalite_kontrol'], true, true),
('yarimamul', 'İşleme', 2, 60, ARRAY['işleme_operatörü'], true, true),
('yarimamul', 'Ara Kalite Kontrol', 3, 10, ARRAY['kalite_kontrol'], true, true),
('yarimamul', 'Temizlik', 4, 5, ARRAY['temizlik_operatörü'], false, true);

-- Başarı mesajı
SELECT 'Üretim aşamaları tabloları başarıyla oluşturuldu!' as message;