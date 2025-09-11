-- Kullanılmayan Tabloları Temizleme Scripti
-- ThunderV1 v1.0.0 - Veritabanı Optimizasyonu

-- Bu script kullanılmayan 9 tabloyu siler
-- Güvenli geri dönüş için önce yedek alın

-- 1. Workflow ile ilgili tablolar (workflow özelliği kaldırıldı)
DROP TABLE IF EXISTS workflow_step_templates CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;

-- 2. Üretim süreçleri tabloları (kullanılmıyor)
DROP TABLE IF EXISTS uretim_surec_detaylari CASCADE;
DROP TABLE IF EXISTS uretim_surecleri CASCADE;

-- 3. Stok hareketleri tablosu (kullanılmıyor)
DROP TABLE IF EXISTS stok_hareketleri CASCADE;

-- 4. Üretim talepleri tablosu (kullanılmıyor)
DROP TABLE IF EXISTS uretim_talepleri CASCADE;

-- 5. Üretim siparişleri tablosu (kullanılmıyor)
DROP TABLE IF EXISTS uretim_siparisleri CASCADE;

-- 6. Maliyet hesaplamaları tablosu (kullanılmıyor)
DROP TABLE IF EXISTS maliyet_hesaplamalari CASCADE;

-- 7. İş emri durum geçmişi tablosu (kullanılmıyor)
DROP TABLE IF EXISTS work_order_status_history CASCADE;

-- Temizlik tamamlandı mesajı
SELECT 'Kullanılmayan 9 tablo başarıyla silindi!' as cleanup_status;
