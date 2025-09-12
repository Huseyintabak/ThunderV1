-- Kullanılmayan Tabloları Temizleme Scripti - V2
-- ThunderV1 v1.5.0 - Veritabanı Optimizasyonu
-- Tarih: Eylül 2025

-- Bu script gerçekten kullanılmayan tabloları siler
-- Güvenli geri dönüş için önce yedek alın

-- 1. Barcode_scans tablosu (API endpoint'i yok, çalışmıyor)
DROP TABLE IF EXISTS barcode_scans CASCADE;

-- 2. Quality_checks tablosu (henüz kullanılmıyor)
DROP TABLE IF EXISTS quality_checks CASCADE;

-- 3. Eski workflow tabloları (kullanılmıyor)
DROP TABLE IF EXISTS workflow_step_templates CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;

-- 4. Eski üretim süreçleri tabloları (kullanılmıyor)
DROP TABLE IF EXISTS uretim_surec_detaylari CASCADE;
DROP TABLE IF EXISTS uretim_surecleri CASCADE;

-- 5. Eski üretim talepleri tablosu (kullanılmıyor)
DROP TABLE IF EXISTS uretim_talepleri CASCADE;

-- 6. Eski üretim siparişleri tablosu (kullanılmıyor)
DROP TABLE IF EXISTS uretim_siparisleri CASCADE;

-- 7. Eski maliyet hesaplamaları tablosu (kullanılmıyor)
DROP TABLE IF EXISTS maliyet_hesaplamalari CASCADE;

-- 8. Eski iş emri durum geçmişi tablosu (kullanılmıyor)
DROP TABLE IF EXISTS work_order_status_history CASCADE;

-- Temizlik tamamlandı mesajı
SELECT 'Kullanılmayan tablolar başarıyla silindi!' as cleanup_status;
