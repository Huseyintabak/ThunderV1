-- TABLO KOLON ADLARINI KONTROL ET
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- 1. Hammaddeler tablosu kolonları
SELECT 'HAMMADDELER TABLOSU KOLONLARI' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hammaddeler' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Yarimamuller tablosu kolonları
SELECT 'YARIMAMULLER TABLOSU KOLONLARI' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'yarimamuller' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Nihai_urunler tablosu kolonları
SELECT 'NIHAI_URUNLER TABLOSU KOLONLARI' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'nihai_urunler' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Hammaddeler tablosundan örnek veri
SELECT 'HAMMADDELER ÖRNEK VERİ' as info;
SELECT * FROM hammaddeler 
WHERE id IN (21, 67, 69, 84, 102, 103, 1757664914912)
LIMIT 10;

-- 5. Yarimamuller tablosundan örnek veri
SELECT 'YARIMAMULLER ÖRNEK VERİ' as info;
SELECT * FROM yarimamuller 
WHERE id IN (509, 510, 511, 512, 513, 515)
LIMIT 10;


