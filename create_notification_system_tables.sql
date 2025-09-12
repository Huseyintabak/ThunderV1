-- Faz 5: Bildirim ve Uyarı Sistemi Tabloları
-- V1.6.0 - Bildirim ve Uyarı Yönetimi

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

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_alert_rules_entity_type ON alert_rules(entity_type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_alert_history_entity ON alert_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_status ON alert_history(status);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_notification_preferences(user_id);

-- RLS (Row Level Security) politikaları
ALTER TABLE notification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Notification types RLS politikaları
CREATE POLICY IF NOT EXISTS "notification_types_select_policy" ON notification_types
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "notification_types_insert_policy" ON notification_types
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "notification_types_update_policy" ON notification_types
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "notification_types_delete_policy" ON notification_types
    FOR DELETE USING (true);

-- Notifications RLS politikaları
CREATE POLICY IF NOT EXISTS "notifications_select_policy" ON notifications
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "notifications_insert_policy" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "notifications_update_policy" ON notifications
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "notifications_delete_policy" ON notifications
    FOR DELETE USING (true);

-- Alert rules RLS politikaları
CREATE POLICY IF NOT EXISTS "alert_rules_select_policy" ON alert_rules
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "alert_rules_insert_policy" ON alert_rules
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "alert_rules_update_policy" ON alert_rules
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "alert_rules_delete_policy" ON alert_rules
    FOR DELETE USING (true);

-- Alert history RLS politikaları
CREATE POLICY IF NOT EXISTS "alert_history_select_policy" ON alert_history
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "alert_history_insert_policy" ON alert_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "alert_history_update_policy" ON alert_history
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "alert_history_delete_policy" ON alert_history
    FOR DELETE USING (true);

-- User notification preferences RLS politikaları
CREATE POLICY IF NOT EXISTS "user_notification_preferences_select_policy" ON user_notification_preferences
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "user_notification_preferences_insert_policy" ON user_notification_preferences
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "user_notification_preferences_update_policy" ON user_notification_preferences
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "user_notification_preferences_delete_policy" ON user_notification_preferences
    FOR DELETE USING (true);

-- Notification templates RLS politikaları
CREATE POLICY IF NOT EXISTS "notification_templates_select_policy" ON notification_templates
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "notification_templates_insert_policy" ON notification_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "notification_templates_update_policy" ON notification_templates
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "notification_templates_delete_policy" ON notification_templates
    FOR DELETE USING (true);

-- Trigger'lar - updated_at otomatik güncelleme
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

-- Örnek bildirim türleri
INSERT INTO notification_types (type_name, display_name, description, icon, color) VALUES
('production_started', 'Üretim Başladı', 'Yeni üretim başlatıldı', 'play-circle', '#28a745'),
('production_completed', 'Üretim Tamamlandı', 'Üretim başarıyla tamamlandı', 'check-circle', '#28a745'),
('production_delayed', 'Üretim Gecikmesi', 'Üretimde gecikme yaşandı', 'clock', '#ffc107'),
('quality_failed', 'Kalite Hatası', 'Kalite kontrolü başarısız', 'exclamation-triangle', '#dc3545'),
('inventory_low', 'Stok Uyarısı', 'Stok seviyesi düşük', 'box', '#fd7e14'),
('order_urgent', 'Acil Sipariş', 'Acil sipariş alındı', 'exclamation', '#dc3545'),
('system_error', 'Sistem Hatası', 'Sistem hatası oluştu', 'bug', '#6f42c1'),
('maintenance_due', 'Bakım Zamanı', 'Makine bakım zamanı', 'wrench', '#17a2b8');

-- Örnek uyarı kuralları
INSERT INTO alert_rules (rule_name, description, entity_type, condition_field, condition_operator, condition_value, notification_type_id, priority) VALUES
('Düşük Stok Uyarısı', 'Stok miktarı 10\'un altına düştüğünde', 'inventory', 'quantity', 'less_than', '10', (SELECT id FROM notification_types WHERE type_name = 'inventory_low'), 'high'),
('Üretim Gecikmesi', 'Üretim süresi planlanandan 2 saat fazla', 'production', 'delay_hours', 'greater_than', '2', (SELECT id FROM notification_types WHERE type_name = 'production_delayed'), 'medium'),
('Kalite Hatası', 'Kalite kontrolü başarısız', 'quality', 'result', 'equals', 'fail', (SELECT id FROM notification_types WHERE type_name = 'quality_failed'), 'critical'),
('Acil Sipariş', 'Sipariş önceliği 1 (en yüksek)', 'order', 'priority', 'equals', '1', (SELECT id FROM notification_types WHERE type_name = 'order_urgent'), 'critical');

-- Örnek bildirim şablonları
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
 '{"product_name", "current_quantity", "min_quantity"}');

-- Başarı mesajı
SELECT 'Bildirim ve uyarı sistemi tabloları başarıyla oluşturuldu!' as message;
