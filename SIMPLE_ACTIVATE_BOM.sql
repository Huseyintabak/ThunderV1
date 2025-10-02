-- ============================================
-- TÜM BOM KAYITLARINI AKTİF HALE GETİR - BASİT ÇÖZÜM
-- Bu SQL'i Supabase SQL Editor'da çalıştırın
-- ============================================

-- 1. MEVCUT DURUMU GÖR
SELECT 
    COUNT(*) as toplam_kayit,
    SUM(CASE WHEN aktif = true THEN 1 ELSE 0 END) as aktif,
    SUM(CASE WHEN aktif = false THEN 1 ELSE 0 END) as pasif
FROM urun_agaci;

-- 2. TÜM BOM KAYITLARINI AKTİF YAP
UPDATE urun_agaci
SET aktif = true
WHERE aktif = false OR aktif IS NULL;

-- 3. GÜNCELLEME SONUCUNU GÖR
SELECT 
    COUNT(*) as toplam_kayit,
    SUM(CASE WHEN aktif = true THEN 1 ELSE 0 END) as aktif,
    SUM(CASE WHEN aktif = false THEN 1 ELSE 0 END) as pasif
FROM urun_agaci;

-- 4. PRODUCT ID 1241 İÇİN BOM KONTROL
SELECT 
    ana_urun_id,
    alt_urun_id,
    alt_urun_tipi,
    gerekli_miktar,
    aktif
FROM urun_agaci
WHERE ana_urun_id = 1241 AND ana_urun_tipi = 'nihai'
ORDER BY alt_urun_tipi, alt_urun_id;

-- 5. TÜM NİHAİ ÜRÜNLER İÇİN AKTİF BOM SAYILARI
SELECT 
    ana_urun_id,
    COUNT(*) as bom_sayisi
FROM urun_agaci
WHERE ana_urun_tipi = 'nihai' AND aktif = true
GROUP BY ana_urun_id
ORDER BY ana_urun_id
LIMIT 20;


