-- BOM Verilerini Kontrol Et
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Mevcut BOM verilerini kontrol et
SELECT 
    ana_urun_id,
    ana_urun_tipi,
    COUNT(*) as malzeme_sayisi
FROM urun_agaci 
WHERE ana_urun_tipi = 'nihai'
GROUP BY ana_urun_id, ana_urun_tipi
ORDER BY ana_urun_id;

-- 2. Product ID 177 için BOM kontrol et
SELECT * FROM urun_agaci 
WHERE ana_urun_id = 177 AND ana_urun_tipi = 'nihai';

-- 3. Nihai ürünler tablosunda ID 177'yi kontrol et
SELECT id, ad, kod FROM nihai_urunler WHERE id = 177;

-- 4. Tüm nihai ürünleri listele
SELECT id, ad, kod FROM nihai_urunler ORDER BY id;

-- 5. BOM tanımlanmış nihai ürünleri listele
SELECT DISTINCT 
    n.id,
    n.ad,
    n.kod,
    COUNT(ua.id) as bom_malzeme_sayisi
FROM nihai_urunler n
LEFT JOIN urun_agaci ua ON ua.ana_urun_id = n.id AND ua.ana_urun_tipi = 'nihai'
GROUP BY n.id, n.ad, n.kod
ORDER BY n.id;

