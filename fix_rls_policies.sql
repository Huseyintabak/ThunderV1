-- RLS Politikalarını Düzelt
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Mevcut RLS politikalarını kaldır
DROP POLICY IF EXISTS "Operators can view their own data" ON production_states;
DROP POLICY IF EXISTS "Operators can view their own history" ON production_history;
DROP POLICY IF EXISTS "Operators can view their own notifications" ON production_notifications;
DROP POLICY IF EXISTS "Operators can update their own data" ON production_states;
DROP POLICY IF EXISTS "Everyone can read system settings" ON system_settings;

-- Geçici olarak RLS'yi devre dışı bırak (geliştirme aşamasında)
ALTER TABLE production_states DISABLE ROW LEVEL SECURITY;
ALTER TABLE production_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE operators DISABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE production_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- Alternatif olarak, daha esnek politikalar oluştur
-- ALTER TABLE production_states ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE production_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE realtime_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE production_notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- -- Tüm kullanıcılar için okuma izni
-- CREATE POLICY "Allow all read access" ON production_states FOR SELECT USING (true);
-- CREATE POLICY "Allow all read access" ON production_history FOR SELECT USING (true);
-- CREATE POLICY "Allow all read access" ON operators FOR SELECT USING (true);
-- CREATE POLICY "Allow all read access" ON realtime_events FOR SELECT USING (true);
-- CREATE POLICY "Allow all read access" ON production_notifications FOR SELECT USING (true);
-- CREATE POLICY "Allow all read access" ON system_settings FOR SELECT USING (true);

-- -- Tüm kullanıcılar için yazma izni (geliştirme aşamasında)
-- CREATE POLICY "Allow all insert access" ON production_states FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow all insert access" ON production_history FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow all insert access" ON operators FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow all insert access" ON realtime_events FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow all insert access" ON production_notifications FOR INSERT WITH CHECK (true);

-- -- Tüm kullanıcılar için güncelleme izni
-- CREATE POLICY "Allow all update access" ON production_states FOR UPDATE USING (true);
-- CREATE POLICY "Allow all update access" ON production_history FOR UPDATE USING (true);
-- CREATE POLICY "Allow all update access" ON operators FOR UPDATE USING (true);
-- CREATE POLICY "Allow all update access" ON realtime_events FOR UPDATE USING (true);
-- CREATE POLICY "Allow all update access" ON production_notifications FOR UPDATE USING (true);

-- -- Tüm kullanıcılar için silme izni
-- CREATE POLICY "Allow all delete access" ON production_states FOR DELETE USING (true);
-- CREATE POLICY "Allow all delete access" ON production_history FOR DELETE USING (true);
-- CREATE POLICY "Allow all delete access" ON operators FOR DELETE USING (true);
-- CREATE POLICY "Allow all delete access" ON realtime_events FOR DELETE USING (true);
-- CREATE POLICY "Allow all delete access" ON production_notifications FOR DELETE USING (true);

-- Test verisi ekle
INSERT INTO production_states (order_id, product_code, product_name, target_quantity, produced_quantity, is_active, is_completed, operator_id, operator_name, production_data) VALUES
('TEST-001', 'PROD-001', 'Test Ürün 1', 10, 0, true, false, 'OP-001', 'Test Operatör', '{"history": []}'),
('TEST-002', 'PROD-002', 'Test Ürün 2', 20, 5, true, false, 'OP-002', 'Test Operatör 2', '{"history": []}');

-- Test operatörleri ekle
INSERT INTO operators (operator_id, name, department, skill_level, is_active) VALUES
('OP-001', 'Test Operatör 1', 'Üretim', 'Uzman', true),
('OP-002', 'Test Operatör 2', 'Üretim', 'Uzman', true);

-- Test bildirimi ekle
INSERT INTO production_notifications (operator_id, notification_type, title, message, is_read) VALUES
('OP-001', 'info', 'Hoş Geldiniz', 'Sisteme başarıyla giriş yaptınız', false);

-- Test ayarları ekle (eğer yoksa)
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('production_auto_save_interval', '{"seconds": 30}', 'Üretim verilerinin otomatik kaydedilme aralığı'),
('barcode_validation_strict', '{"enabled": true}', 'Barkod doğrulama sıkı modu'),
('realtime_updates_enabled', '{"enabled": true}', 'Gerçek zamanlı güncellemeler'),
('max_concurrent_productions', '{"count": 5}', 'Aynı anda maksimum üretim sayısı'),
('notification_retention_days', '{"days": 30}', 'Bildirim saklama süresi')
ON CONFLICT (setting_key) DO NOTHING;