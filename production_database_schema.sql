-- ThunderV1 Üretim Yönetim Sistemi - Tam Veritabanı Çözümü
-- Real-time güncellemeler ve üretim takibi için gelişmiş tablolar

-- 1. ÜRETİM DURUMLARI TABLOSU (localStorage yerine)
CREATE TABLE IF NOT EXISTS production_states (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    product_code VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    target_quantity INTEGER NOT NULL,
    produced_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_completed BOOLEAN DEFAULT false,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_update_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    operator_id VARCHAR(100),
    operator_name VARCHAR(255),
    production_data JSONB, -- Üretim detayları ve geçmiş
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id, product_code)
);

-- 2. ÜRETİM GEÇMİŞİ TABLOSU (detaylı log)
CREATE TABLE IF NOT EXISTS production_history (
    id BIGSERIAL PRIMARY KEY,
    production_state_id BIGINT REFERENCES production_states(id) ON DELETE CASCADE,
    barcode VARCHAR(100),
    quantity INTEGER NOT NULL,
    entry_type VARCHAR(20) DEFAULT 'manual' CHECK (entry_type IN ('manual', 'barcode', 'system')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    operator_id VARCHAR(100),
    operator_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. OPERATÖR TABLOSU (gelişmiş)
CREATE TABLE IF NOT EXISTS operators (
    id BIGSERIAL PRIMARY KEY,
    operator_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    skill_level VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    current_production_id BIGINT REFERENCES production_states(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. REAL-TIME EVENTS TABLOSU (WebSocket için)
CREATE TABLE IF NOT EXISTS realtime_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- production_start, production_update, production_complete, etc.
    event_data JSONB NOT NULL,
    target_operator_id VARCHAR(100),
    target_department VARCHAR(100),
    is_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ÜRETİM NOTİFİKASYONLARI
CREATE TABLE IF NOT EXISTS production_notifications (
    id BIGSERIAL PRIMARY KEY,
    operator_id VARCHAR(100),
    notification_type VARCHAR(50) NOT NULL, -- warning, success, error, info
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_required BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 6. SİSTEM AYARLARI
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İNDEKSLER
CREATE INDEX IF NOT EXISTS idx_production_states_order_product ON production_states(order_id, product_code);
CREATE INDEX IF NOT EXISTS idx_production_states_active ON production_states(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_production_states_operator ON production_states(operator_id);
CREATE INDEX IF NOT EXISTS idx_production_history_production_state ON production_history(production_state_id);
CREATE INDEX IF NOT EXISTS idx_production_history_timestamp ON production_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_operators_active ON operators(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_realtime_events_processed ON realtime_events(is_processed) WHERE is_processed = false;
CREATE INDEX IF NOT EXISTS idx_realtime_events_type ON realtime_events(event_type);
CREATE INDEX IF NOT EXISTS idx_notifications_operator ON production_notifications(operator_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON production_notifications(is_read) WHERE is_read = false;

-- TRIGGER'LAR (otomatik güncelleme için)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Production states tablosu için trigger
CREATE TRIGGER update_production_states_updated_at 
    BEFORE UPDATE ON production_states 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Operators tablosu için trigger
CREATE TRIGGER update_operators_updated_at 
    BEFORE UPDATE ON operators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) politikaları
ALTER TABLE production_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_notifications ENABLE ROW LEVEL SECURITY;

-- Operatörler kendi verilerini görebilir
CREATE POLICY "Operators can view their own data" ON production_states
    FOR SELECT USING (operator_id = current_setting('app.current_operator_id', true));

CREATE POLICY "Operators can view their own history" ON production_history
    FOR SELECT USING (operator_id = current_setting('app.current_operator_id', true));

CREATE POLICY "Operators can view their own notifications" ON production_notifications
    FOR SELECT USING (operator_id = current_setting('app.current_operator_id', true));

-- Operatörler kendi verilerini güncelleyebilir
CREATE POLICY "Operators can update their own data" ON production_states
    FOR UPDATE USING (operator_id = current_setting('app.current_operator_id', true));

-- Sistem ayarları herkes okuyabilir
CREATE POLICY "Everyone can read system settings" ON system_settings
    FOR SELECT USING (true);

-- Başlangıç verileri
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('production_auto_save_interval', '{"seconds": 30}', 'Üretim verilerinin otomatik kaydedilme aralığı'),
('barcode_validation_strict', '{"enabled": true}', 'Barkod doğrulama sıkı modu'),
('realtime_updates_enabled', '{"enabled": true}', 'Gerçek zamanlı güncellemeler'),
('max_concurrent_productions', '{"count": 5}', 'Aynı anda maksimum üretim sayısı'),
('notification_retention_days', '{"days": 30}', 'Bildirim saklama süresi')
ON CONFLICT (setting_key) DO NOTHING;
