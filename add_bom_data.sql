-- BOM Verilerini Ekle
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Önce mevcut BOM verilerini kontrol et
SELECT 'Mevcut BOM verileri:' as info;
SELECT 
    ana_urun_id,
    ana_urun_tipi,
    COUNT(*) as malzeme_sayisi
FROM urun_agaci 
WHERE ana_urun_tipi = 'nihai'
GROUP BY ana_urun_id, ana_urun_tipi
ORDER BY ana_urun_id;

-- Product ID 177 için BOM ekle (TRX-2-GRAY-98-92)
-- Örnek BOM: 1 adet nihai ürün için 2 adet hammadde gerekli

-- Önce hangi hammaddeler var kontrol et
SELECT 'Mevcut hammaddeler:' as info;
SELECT id, ad, kod FROM hammaddeler LIMIT 10;

-- Önce hangi yarı mamuller var kontrol et
SELECT 'Mevcut yarı mamuller:' as info;
SELECT id, ad, kod FROM yarimamuller LIMIT 10;

-- Product ID 177 için BOM ekle
-- Not: Gerçek hammadde/yarı mamul ID'lerini kullanın

-- Örnek BOM ekleme (gerçek ID'leri kullanın):
/*
INSERT INTO urun_agaci (
    ana_urun_id, 
    ana_urun_tipi, 
    alt_urun_id, 
    alt_urun_tipi, 
    gerekli_miktar, 
    birim, 
    aktif
) VALUES 
-- Hammadde 1
(177, 'nihai', 1, 'hammadde', 2.0, 'adet', true),
-- Hammadde 2  
(177, 'nihai', 2, 'hammadde', 1.5, 'adet', true),
-- Yarı Mamul 1
(177, 'nihai', 1, 'yarimamul', 1.0, 'adet', true);
*/

-- BOM ekledikten sonra kontrol et
SELECT 'Eklenen BOM verileri:' as info;
SELECT * FROM urun_agaci WHERE ana_urun_id = 177 AND ana_urun_tipi = 'nihai';

