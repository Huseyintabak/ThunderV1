-- Test verilerini temizle
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Test production states'leri kaldır
DELETE FROM production_states WHERE order_id LIKE 'TEST-%';

-- Test production history'yi kaldır
DELETE FROM production_history WHERE production_state_id IN (
    SELECT id FROM production_states WHERE order_id LIKE 'TEST-%'
);

-- Test operatörleri kaldır
DELETE FROM operators WHERE operator_id LIKE 'OP-%' AND name LIKE 'Test%';

-- Test bildirimlerini kaldır
DELETE FROM production_notifications WHERE operator_id LIKE 'OP-%';

-- Test realtime events'leri kaldır
DELETE FROM realtime_events WHERE event_data::text LIKE '%TEST%';

-- Temizlik sonrası kontrol
SELECT 'Production States' as table_name, COUNT(*) as count FROM production_states
UNION ALL
SELECT 'Production History' as table_name, COUNT(*) as count FROM production_history
UNION ALL
SELECT 'Operators' as table_name, COUNT(*) as count FROM operators
UNION ALL
SELECT 'Notifications' as table_name, COUNT(*) as count FROM production_notifications
UNION ALL
SELECT 'Realtime Events' as table_name, COUNT(*) as count FROM realtime_events;

