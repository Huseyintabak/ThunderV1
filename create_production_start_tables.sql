-- Üretim Başlat Tab'ı için gerekli tablolar
-- Aktif üretimler tablosu
CREATE TABLE IF NOT EXISTS active_productions (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT REFERENCES production_plans(id),
    product_type VARCHAR(20) NOT NULL, -- 'yarimamul', 'nihai'
    product_id BIGINT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    planned_quantity INTEGER NOT NULL,
    produced_quantity INTEGER DEFAULT 0,
    assigned_operator VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'completed', 'cancelled'
    start_time TIMESTAMP DEFAULT NOW(),
    estimated_end_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    current_stage VARCHAR(100),
    quality_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'passed', 'failed'
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Üretim aşamaları tablosu
CREATE TABLE IF NOT EXISTS production_stages (
    id BIGSERIAL PRIMARY KEY,
    production_id BIGINT REFERENCES active_productions(id),
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'skipped'
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    operator VARCHAR(100),
    notes TEXT,
    quality_check_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Kalite kontrol noktaları tablosu
CREATE TABLE IF NOT EXISTS production_quality_checks (
    id BIGSERIAL PRIMARY KEY,
    production_id BIGINT REFERENCES active_productions(id),
    stage_id BIGINT REFERENCES production_stages(id),
    checkpoint_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'passed', 'failed'
    checked_by VARCHAR(100),
    check_time TIMESTAMP,
    notes TEXT,
    measurements JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexler oluştur
CREATE INDEX IF NOT EXISTS idx_active_productions_plan_id ON active_productions(plan_id);
CREATE INDEX IF NOT EXISTS idx_active_productions_status ON active_productions(status);
CREATE INDEX IF NOT EXISTS idx_active_productions_operator ON active_productions(assigned_operator);
CREATE INDEX IF NOT EXISTS idx_production_stages_production_id ON production_stages(production_id);
CREATE INDEX IF NOT EXISTS idx_production_stages_status ON production_stages(status);
CREATE INDEX IF NOT EXISTS idx_quality_checks_production_id ON production_quality_checks(production_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_status ON production_quality_checks(status);

-- RLS (Row Level Security) politikaları
ALTER TABLE active_productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_quality_checks ENABLE ROW LEVEL SECURITY;

-- RLS politikaları oluştur (herkese okuma/yazma izni)
CREATE POLICY "Enable all operations for active_productions" ON active_productions FOR ALL USING (true);
CREATE POLICY "Enable all operations for production_stages" ON production_stages FOR ALL USING (true);
CREATE POLICY "Enable all operations for production_quality_checks" ON production_quality_checks FOR ALL USING (true);
