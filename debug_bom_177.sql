-- Product ID 177 için detaylı BOM kontrolü
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Product ID 177'nin nihai ürünler tablosunda var mı?
SELECT 'Nihai Ürün ID 177:' as info;
SELECT id, ad, kod, aktif FROM nihai_urunler WHERE id = 177;

-- 2. BOM tablosunda ID 177 için kayıt var mı?
SELECT 'BOM Kayıtları ID 177:' as info;
SELECT 
    id,
    ana_urun_id, 
    ana_urun_tipi, 
    alt_urun_id, 
    alt_urun_tipi, 
    gerekli_miktar, 
    aktif
FROM urun_agaci 
WHERE ana_urun_id = 177 AND ana_urun_tipi = 'nihai';

-- 3. Tüm BOM kayıtlarını listele (nihai ürünler için)
SELECT 'Tüm Nihai Ürün BOM Kayıtları:' as info;
SELECT 
    ana_urun_id,
    ana_urun_tipi,
    alt_urun_id,
    alt_urun_tipi,
    gerekli_miktar,
    aktif,
    COUNT(*) as kayit_sayisi
FROM urun_agaci 
WHERE ana_urun_tipi = 'nihai'
GROUP BY ana_urun_id, ana_urun_tipi, alt_urun_id, alt_urun_tipi, gerekli_miktar, aktif
ORDER BY ana_urun_id;

-- 4. ID 177 civarındaki BOM kayıtlarını kontrol et
SELECT 'ID 177 Civarı BOM Kayıtları:' as info;
SELECT 
    ana_urun_id,
    ana_urun_tipi,
    COUNT(*) as malzeme_sayisi
FROM urun_agaci 
WHERE ana_urun_tipi = 'nihai' 
  AND ana_urun_id BETWEEN 170 AND 185
GROUP BY ana_urun_id, ana_urun_tipi
ORDER BY ana_urun_id;

-- 5. Aktif olmayan BOM kayıtlarını kontrol et
SELECT 'Aktif Olmayan BOM Kayıtları:' as info;
SELECT 
    ana_urun_id,
    ana_urun_tipi,
    alt_urun_id,
    alt_urun_tipi,
    aktif
FROM urun_agaci 
WHERE ana_urun_tipi = 'nihai' AND aktif = false
ORDER BY ana_urun_id;

