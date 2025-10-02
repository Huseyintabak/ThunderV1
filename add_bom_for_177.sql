-- Product ID 177 için BOM Kayıtları Ekle
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Önce Product ID 177'nin nihai ürünler tablosunda var mı kontrol et
SELECT 'Product ID 177 Kontrol:' as info;
SELECT id, ad, kod, aktif FROM nihai_urunler WHERE id = 177;

-- 2. Product ID 177 için BOM kayıtları ekle
-- Örnek BOM: 1 adet nihai ürün için çeşitli hammaddeler ve yarı mamuller gerekli

INSERT INTO urun_agaci (
    ana_urun_id, 
    ana_urun_tipi, 
    alt_urun_id, 
    alt_urun_tipi, 
    gerekli_miktar, 
    birim, 
    aktif
) VALUES 
-- Hammadde 1: ID 67
(177, 'nihai', 67, 'hammadde', 2.0, 'adet', true),
-- Hammadde 2: ID 103  
(177, 'nihai', 103, 'hammadde', 1.5, 'adet', true),
-- Hammadde 3: ID 84 
(177, 'nihai', 84, 'hammadde', 3.0, 'adet', true),
-- Hammadde 4: ID 21
(177, 'nihai', 21, 'hammadde', 1.0, 'adet', true),
-- Hammadde 5: ID 1757664914912
(177, 'nihai', 1757664914912, 'hammadde', 0.5, 'adet', true),
-- Yarı Mamul 1: ID 509
(177, 'nihai', 509, 'yarimamul', 1.0, 'adet', true);

-- 3. Eklenen BOM kayıtlarını kontrol et
SELECT 'Product ID 177 BOM Kayıtları:' as info;
SELECT 
    id,
    ana_urun_id, 
    ana_urun_tipi, 
    alt_urun_id, 
    alt_urun_tipi, 
    gerekli_miktar,
    birim,
    aktif
FROM urun_agaci 
WHERE ana_urun_id = 177 AND ana_urun_tipi = 'nihai' AND aktif = true;

-- 4. BOM kayıtlarının sayısını kontrol et
SELECT 'Product ID 177 BOM Sayısı:' as info;
SELECT COUNT(*) as bom_kayit_sayisi
FROM urun_agaci 
WHERE ana_urun_id = 177 AND ana_urun_tipi = 'nihai' AND aktif = true;
