-- BOM Kayıtlarını Aktif Hale Getir
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Önce mevcut durumu kontrol et
SELECT 'Mevcut BOM Durumu:' as info;
SELECT 
    ana_urun_id,
    ana_urun_tipi,
    COUNT(*) as toplam_kayit,
    COUNT(CASE WHEN aktif = true THEN 1 END) as aktif_kayit,
    COUNT(CASE WHEN aktif = false THEN 1 END) as pasif_kayit
FROM urun_agaci 
WHERE ana_urun_tipi = 'nihai'
GROUP BY ana_urun_id, ana_urun_tipi
ORDER BY ana_urun_id;

-- 2. Product ID 177 için BOM kayıtlarını aktif hale getir
UPDATE urun_agaci 
SET aktif = true 
WHERE ana_urun_id = 177 AND ana_urun_tipi = 'nihai';

-- 3. Tüm nihai ürün BOM kayıtlarını aktif hale getir (isteğe bağlı)
-- UPDATE urun_agaci 
-- SET aktif = true 
-- WHERE ana_urun_tipi = 'nihai';

-- 4. Güncelleme sonrası durumu kontrol et
SELECT 'Güncelleme Sonrası BOM Durumu:' as info;
SELECT 
    ana_urun_id,
    ana_urun_tipi,
    COUNT(*) as toplam_kayit,
    COUNT(CASE WHEN aktif = true THEN 1 END) as aktif_kayit,
    COUNT(CASE WHEN aktif = false THEN 1 END) as pasif_kayit
FROM urun_agaci 
WHERE ana_urun_tipi = 'nihai'
GROUP BY ana_urun_id, ana_urun_tipi
ORDER BY ana_urun_id;

-- 5. Product ID 177 için aktif BOM kayıtlarını listele
SELECT 'Product ID 177 Aktif BOM Kayıtları:' as info;
SELECT 
    id,
    ana_urun_id, 
    ana_urun_tipi, 
    alt_urun_id, 
    alt_urun_tipi, 
    gerekli_miktar, 
    aktif
FROM urun_agaci 
WHERE ana_urun_id = 177 AND ana_urun_tipi = 'nihai' AND aktif = true;

