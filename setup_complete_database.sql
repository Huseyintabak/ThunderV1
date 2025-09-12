-- ThunderV1 Üretim Yönetim Sistemi - Tam Veritabanı Kurulumu
-- V1.6.0 - Tüm Fazlar

-- ==================== MEVCUT TABLOLAR ====================

-- Hammaddeler tablosu (zaten mevcut)
-- ALTER TABLE hammaddeler ADD COLUMN IF NOT EXISTS barkod VARCHAR(50) UNIQUE;
-- CREATE INDEX IF NOT EXISTS idx_hammaddeler_barkod ON hammaddeler(barkod);

-- Üretimler tablosu (zaten mevcut)
-- productions tablosu mevcut

-- ==================== FAZ 1: ÜRETİM AŞAMALARI ====================

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

-- ==================== FAZ 2: KALİTE KONTROL ====================

-- Kalite kontrol noktaları tablosu
CREATE TABLE IF NOT EXISTS quality_checkpoints (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    product_type VARCHAR(20), -- 'hammadde', 'yarimamul', 'nihai'
    stage_id BIGINT REFERENCES production_stages(id) ON DELETE SET NULL,
    checkpoint_type VARCHAR(50) NOT NULL, -- 'visual', 'measurement', 'test', 'functional'
    parameters JSONB, -- Kontrol kriterleri, ölçüm aralıkları vb.
    is_mandatory BOOLEAN DEFAULT true,
    frequency VARCHAR(50) DEFAULT 'every', -- 'every', 'batch', 'random', 'daily'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gerçekleştirilen kalite kontrolleri tablosu
CREATE TABLE IF NOT EXISTS quality_checks (
    id BIGSERIAL PRIMARY KEY,
    production_id BIGINT REFERENCES productions(id) ON DELETE CASCADE,
    stage_id BIGINT REFERENCES production_stages(id) ON DELETE CASCADE,
    checkpoint_id BIGINT REFERENCES quality_checkpoints(id) ON DELETE CASCADE,
    operator VARCHAR(100),
    check_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    result VARCHAR(20) NOT NULL, -- 'pass', 'fail', 'warning', 'retest'
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
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    standard_type VARCHAR(50), -- 'ISO', 'internal', 'customer_specific'
    product_type VARCHAR(20), -- 'hammadde', 'yarimamul', 'nihai'
    criteria JSONB, -- Detaylı standart kriterleri
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kalite raporları tablosu
CREATE TABLE IF NOT EXISTS quality_reports (
    id BIGSERIAL PRIMARY KEY,
    production_id BIGINT REFERENCES productions(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- 'daily', 'batch', 'final'
    report_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_checks INTEGER,
    passed_checks INTEGER,
    failed_checks INTEGER,
    warning_checks INTEGER,
    quality_score DECIMAL(5,2), -- 0-100 arası
    report_data JSONB, -- Ek rapor verileri
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== FAZ 3: ÜRETİM PLANLAMA ====================

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

-- ==================== FAZ 5: BİLDİRİM SİSTEMİ ====================

-- Bildirim türleri tablosu
CREATE TABLE IF NOT EXISTS notification_types (
    id BIGSERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20) DEFAULT '#007bff',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bildirimler tablosu
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    type_id BIGINT REFERENCES notification_types(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(20) DEFAULT 'unread', -- 'unread', 'read', 'archived'
    recipient_type VARCHAR(20) DEFAULT 'all', -- 'all', 'user', 'role', 'department'
    recipient_id VARCHAR(100),
    related_entity_type VARCHAR(50), -- 'production', 'order', 'quality', 'inventory'
    related_entity_id BIGINT,
    action_url VARCHAR(500),
    expires_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Uyarı kuralları tablosu
CREATE TABLE IF NOT EXISTS alert_rules (
    id BIGSERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    description TEXT,
    entity_type VARCHAR(50) NOT NULL, -- 'production', 'inventory', 'quality', 'order'
    condition_field VARCHAR(100) NOT NULL,
    condition_operator VARCHAR(20) NOT NULL, -- 'equals', 'not_equals', 'greater_than', 'less_than', 'contains'
    condition_value TEXT NOT NULL,
    notification_type_id BIGINT REFERENCES notification_types(id) ON DELETE CASCADE,
    priority VARCHAR(20) DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Uyarı geçmişi tablosu
CREATE TABLE IF NOT EXISTS alert_history (
    id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT REFERENCES alert_rules(id) ON DELETE CASCADE,
    entity_id BIGINT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    triggered_value TEXT,
    notification_id BIGINT REFERENCES notifications(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'triggered', -- 'triggered', 'acknowledged', 'resolved'
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kullanıcı bildirim tercihleri tablosu
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    notification_type_id BIGINT REFERENCES notification_types(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type_id)
);

-- Bildirim şablonları tablosu
CREATE TABLE IF NOT EXISTS notification_templates (
    id BIGSERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    notification_type_id BIGINT REFERENCES notification_types(id) ON DELETE CASCADE,
    subject_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    email_template TEXT,
    sms_template TEXT,
    variables JSONB, -- Kullanılabilecek değişkenler
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== RLS POLİTİKALARI ====================

-- Production stages RLS
ALTER TABLE production_stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "production_stages_select_policy" ON production_stages;
CREATE POLICY "production_stages_select_policy" ON production_stages FOR SELECT USING (true);
DROP POLICY IF EXISTS "production_stages_insert_policy" ON production_stages;
CREATE POLICY "production_stages_insert_policy" ON production_stages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "production_stages_update_policy" ON production_stages;
CREATE POLICY "production_stages_update_policy" ON production_stages FOR UPDATE USING (true);
DROP POLICY IF EXISTS "production_stages_delete_policy" ON production_stages;
CREATE POLICY "production_stages_delete_policy" ON production_stages FOR DELETE USING (true);

-- Production stage templates RLS
ALTER TABLE production_stage_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "production_stage_templates_select_policy" ON production_stage_templates;
CREATE POLICY "production_stage_templates_select_policy" ON production_stage_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "production_stage_templates_insert_policy" ON production_stage_templates;
CREATE POLICY "production_stage_templates_insert_policy" ON production_stage_templates FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "production_stage_templates_update_policy" ON production_stage_templates;
CREATE POLICY "production_stage_templates_update_policy" ON production_stage_templates FOR UPDATE USING (true);
DROP POLICY IF EXISTS "production_stage_templates_delete_policy" ON production_stage_templates;
CREATE POLICY "production_stage_templates_delete_policy" ON production_stage_templates FOR DELETE USING (true);

-- Quality checkpoints RLS
ALTER TABLE quality_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "quality_checkpoints_select_policy" ON quality_checkpoints FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "quality_checkpoints_insert_policy" ON quality_checkpoints FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "quality_checkpoints_update_policy" ON quality_checkpoints FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "quality_checkpoints_delete_policy" ON quality_checkpoints FOR DELETE USING (true);

-- Quality checks RLS
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "quality_checks_select_policy" ON quality_checks FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "quality_checks_insert_policy" ON quality_checks FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "quality_checks_update_policy" ON quality_checks FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "quality_checks_delete_policy" ON quality_checks FOR DELETE USING (true);

-- Quality standards RLS
ALTER TABLE quality_standards ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "quality_standards_select_policy" ON quality_standards FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "quality_standards_insert_policy" ON quality_standards FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "quality_standards_update_policy" ON quality_standards FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "quality_standards_delete_policy" ON quality_standards FOR DELETE USING (true);

-- Quality reports RLS
ALTER TABLE quality_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "quality_reports_select_policy" ON quality_reports FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "quality_reports_insert_policy" ON quality_reports FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "quality_reports_update_policy" ON quality_reports FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "quality_reports_delete_policy" ON quality_reports FOR DELETE USING (true);

-- Production plans RLS
ALTER TABLE production_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "production_plans_select_policy" ON production_plans FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "production_plans_insert_policy" ON production_plans FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "production_plans_update_policy" ON production_plans FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "production_plans_delete_policy" ON production_plans FOR DELETE USING (true);

-- Production plan details RLS
ALTER TABLE production_plan_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "production_plan_details_select_policy" ON production_plan_details FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "production_plan_details_insert_policy" ON production_plan_details FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "production_plan_details_update_policy" ON production_plan_details FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "production_plan_details_delete_policy" ON production_plan_details FOR DELETE USING (true);

-- Resource management RLS
ALTER TABLE resource_management ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "resource_management_select_policy" ON resource_management FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "resource_management_insert_policy" ON resource_management FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "resource_management_update_policy" ON resource_management FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "resource_management_delete_policy" ON resource_management FOR DELETE USING (true);

-- Production scheduling RLS
ALTER TABLE production_scheduling ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "production_scheduling_select_policy" ON production_scheduling FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "production_scheduling_insert_policy" ON production_scheduling FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "production_scheduling_update_policy" ON production_scheduling FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "production_scheduling_delete_policy" ON production_scheduling FOR DELETE USING (true);

-- Order management RLS
ALTER TABLE order_management ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "order_management_select_policy" ON order_management FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "order_management_insert_policy" ON order_management FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "order_management_update_policy" ON order_management FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "order_management_delete_policy" ON order_management FOR DELETE USING (true);

-- Order details RLS
ALTER TABLE order_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "order_details_select_policy" ON order_details FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "order_details_insert_policy" ON order_details FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "order_details_update_policy" ON order_details FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "order_details_delete_policy" ON order_details FOR DELETE USING (true);

-- Capacity planning RLS
ALTER TABLE capacity_planning ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "capacity_planning_select_policy" ON capacity_planning FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "capacity_planning_insert_policy" ON capacity_planning FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "capacity_planning_update_policy" ON capacity_planning FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "capacity_planning_delete_policy" ON capacity_planning FOR DELETE USING (true);

-- Notification types RLS
ALTER TABLE notification_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "notification_types_select_policy" ON notification_types FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "notification_types_insert_policy" ON notification_types FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "notification_types_update_policy" ON notification_types FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "notification_types_delete_policy" ON notification_types FOR DELETE USING (true);

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "notifications_select_policy" ON notifications FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "notifications_insert_policy" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "notifications_update_policy" ON notifications FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "notifications_delete_policy" ON notifications FOR DELETE USING (true);

-- Alert rules RLS
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "alert_rules_select_policy" ON alert_rules FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "alert_rules_insert_policy" ON alert_rules FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "alert_rules_update_policy" ON alert_rules FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "alert_rules_delete_policy" ON alert_rules FOR DELETE USING (true);

-- Alert history RLS
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "alert_history_select_policy" ON alert_history FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "alert_history_insert_policy" ON alert_history FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "alert_history_update_policy" ON alert_history FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "alert_history_delete_policy" ON alert_history FOR DELETE USING (true);

-- User notification preferences RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "user_notification_preferences_select_policy" ON user_notification_preferences FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "user_notification_preferences_insert_policy" ON user_notification_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "user_notification_preferences_update_policy" ON user_notification_preferences FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "user_notification_preferences_delete_policy" ON user_notification_preferences FOR DELETE USING (true);

-- Notification templates RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "notification_templates_select_policy" ON notification_templates FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "notification_templates_insert_policy" ON notification_templates FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "notification_templates_update_policy" ON notification_templates FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "notification_templates_delete_policy" ON notification_templates FOR DELETE USING (true);

-- ==================== INDEX'LER ====================

-- Production stages indexes
CREATE INDEX IF NOT EXISTS idx_production_stages_production_id ON production_stages(production_id);
CREATE INDEX IF NOT EXISTS idx_production_stages_status ON production_stages(status);
CREATE INDEX IF NOT EXISTS idx_production_stage_templates_product_type ON production_stage_templates(product_type);

-- Quality control indexes
CREATE INDEX IF NOT EXISTS idx_quality_checkpoints_product_type ON quality_checkpoints(product_type);
CREATE INDEX IF NOT EXISTS idx_quality_checkpoints_stage_id ON quality_checkpoints(stage_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_production_id ON quality_checks(production_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_checkpoint_id ON quality_checks(checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_quality_standards_product_type ON quality_standards(product_type);
CREATE INDEX IF NOT EXISTS idx_quality_reports_production_id ON quality_reports(production_id);

-- Production planning indexes
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

-- Notification system indexes
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_alert_rules_entity_type ON alert_rules(entity_type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_alert_history_entity ON alert_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_status ON alert_history(status);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_notification_preferences(user_id);

-- ==================== TRIGGER'LAR ====================

-- updated_at otomatik güncelleme trigger'ları
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Production stages triggers
CREATE TRIGGER update_production_stages_updated_at 
    BEFORE UPDATE ON production_stages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Quality control triggers
CREATE TRIGGER update_quality_checkpoints_updated_at 
    BEFORE UPDATE ON quality_checkpoints 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_standards_updated_at 
    BEFORE UPDATE ON quality_standards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Production planning triggers
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

-- Notification system triggers
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at 
    BEFORE UPDATE ON alert_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at 
    BEFORE UPDATE ON user_notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== ÖRNEK VERİLER ====================

-- Bildirim türleri
INSERT INTO notification_types (type_name, display_name, description, icon, color) VALUES
('production_started', 'Üretim Başladı', 'Yeni üretim başlatıldı', 'play-circle', '#28a745'),
('production_completed', 'Üretim Tamamlandı', 'Üretim başarıyla tamamlandı', 'check-circle', '#28a745'),
('production_delayed', 'Üretim Gecikmesi', 'Üretimde gecikme yaşandı', 'clock', '#ffc107'),
('quality_failed', 'Kalite Hatası', 'Kalite kontrolü başarısız', 'exclamation-triangle', '#dc3545'),
('inventory_low', 'Stok Uyarısı', 'Stok seviyesi düşük', 'box', '#fd7e14'),
('order_urgent', 'Acil Sipariş', 'Acil sipariş alındı', 'exclamation', '#dc3545'),
('system_error', 'Sistem Hatası', 'Sistem hatası oluştu', 'bug', '#6f42c1'),
('maintenance_due', 'Bakım Zamanı', 'Makine bakım zamanı', 'wrench', '#17a2b8')
ON CONFLICT (type_name) DO NOTHING;

-- Uyarı kuralları
INSERT INTO alert_rules (rule_name, description, entity_type, condition_field, condition_operator, condition_value, notification_type_id, priority) VALUES
('Düşük Stok Uyarısı', 'Stok miktarı 10''un altına düştüğünde', 'inventory', 'quantity', 'less_than', '10', (SELECT id FROM notification_types WHERE type_name = 'inventory_low'), 'high'),
('Üretim Gecikmesi', 'Üretim süresi planlanandan 2 saat fazla', 'production', 'delay_hours', 'greater_than', '2', (SELECT id FROM notification_types WHERE type_name = 'production_delayed'), 'medium'),
('Kalite Hatası', 'Kalite kontrolü başarısız', 'quality', 'result', 'equals', 'fail', (SELECT id FROM notification_types WHERE type_name = 'quality_failed'), 'critical'),
('Acil Sipariş', 'Sipariş önceliği 1 (en yüksek)', 'order', 'priority', 'equals', '1', (SELECT id FROM notification_types WHERE type_name = 'order_urgent'), 'critical')
ON CONFLICT DO NOTHING;

-- Kaynak yönetimi örnek verileri
INSERT INTO resource_management (resource_name, resource_type, capacity, cost_per_hour, skills_required, is_active, location) VALUES
('Montaj Hattı 1', 'machine', 8, 50.00, ARRAY['montaj', 'kalite_kontrol'], true, 'Üretim Salonu A'),
('Montaj Hattı 2', 'machine', 8, 50.00, ARRAY['montaj', 'kalite_kontrol'], true, 'Üretim Salonu A'),
('Kalite Kontrol İstasyonu', 'machine', 8, 30.00, ARRAY['kalite_kontrol', 'ölçüm'], true, 'Kalite Laboratuvarı'),
('Operatör 1 - Ahmet Yılmaz', 'operator', 8, 25.00, ARRAY['montaj', 'paketleme'], true, 'Üretim Salonu A'),
('Operatör 2 - Fatma Demir', 'operator', 8, 25.00, ARRAY['kalite_kontrol', 'test'], true, 'Kalite Laboratuvarı'),
('Operatör 3 - Mehmet Kaya', 'operator', 8, 25.00, ARRAY['montaj', 'bakım'], true, 'Üretim Salonu B'),
('Paketleme İstasyonu', 'machine', 8, 20.00, ARRAY['paketleme', 'etiketleme'], true, 'Sevkiyat Alanı')
ON CONFLICT DO NOTHING;

-- Bildirim şablonları
INSERT INTO notification_templates (template_name, notification_type_id, subject_template, message_template, variables) VALUES
('Üretim Başladı Şablonu', 
 (SELECT id FROM notification_types WHERE type_name = 'production_started'),
 'Üretim Başladı - {product_name}',
 'Üretim ID: {production_id}\nÜrün: {product_name}\nMiktar: {quantity}\nOperatör: {operator}\nBaşlangıç: {start_time}',
 '{"production_id", "product_name", "quantity", "operator", "start_time"}'),

('Kalite Hatası Şablonu',
 (SELECT id FROM notification_types WHERE type_name = 'quality_failed'),
 'Kalite Hatası - {production_id}',
 'Üretim ID: {production_id}\nHata: {error_message}\nKontrol Noktası: {checkpoint_name}\nOperatör: {operator}\nZaman: {check_time}',
 '{"production_id", "error_message", "checkpoint_name", "operator", "check_time"}'),

('Düşük Stok Şablonu',
 (SELECT id FROM notification_types WHERE type_name = 'inventory_low'),
 'Stok Uyarısı - {product_name}',
 'Ürün: {product_name}\nMevcut Stok: {current_quantity}\nMinimum Stok: {min_quantity}\nKritik Seviye!',
 '{"product_name", "current_quantity", "min_quantity"}')
ON CONFLICT DO NOTHING;

-- Başarı mesajı
SELECT 'ThunderV1 tam veritabanı kurulumu başarıyla tamamlandı!' as message;
