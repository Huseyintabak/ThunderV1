-- Ürün Ağacı Tablosu Yapısını ve Verilerini Analiz Et
-- BOM sorgusu problemini çözmek için veritabanı analizi

-- 1. Ürün ağacı tablosunun yapısını kontrol et
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'urun_agaci' 
ORDER BY ordinal_position;

-- 2. Ürün ağacı tablosundaki toplam kayıt sayısı
SELECT COUNT(*) as total_records FROM urun_agaci;

-- 3. Aktif kayıt sayısı
SELECT COUNT(*) as active_records FROM urun_agaci WHERE aktif = true;

-- 4. İlk 10 kaydı göster
SELECT * FROM urun_agaci LIMIT 10;

-- 5. Product ID 177 için BOM kayıtları
SELECT 
    id,
    ana_urun_id,
    malzeme_id,
    malzeme_adi,
    miktar,
    aktif,
    created_at,
    updated_at
FROM urun_agaci 
WHERE ana_urun_id = 177 
ORDER BY id;

-- 6. Product ID 1241 için BOM kayıtları
SELECT 
    id,
    ana_urun_id,
    malzeme_id,
    malzeme_adi,
    miktar,
    aktif,
    created_at,
    updated_at
FROM urun_agaci 
WHERE ana_urun_id = 1241 
ORDER BY id;

-- 7. Aktif olan tüm BOM kayıtları (ilk 20)
SELECT 
    id,
    ana_urun_id,
    malzeme_id,
    malzeme_adi,
    miktar,
    aktif
FROM urun_agaci 
WHERE aktif = true 
ORDER BY ana_urun_id, id
LIMIT 20;

-- 8. Her ana ürün için BOM sayısı
SELECT 
    ana_urun_id,
    COUNT(*) as bom_count,
    COUNT(CASE WHEN aktif = true THEN 1 END) as active_bom_count
FROM urun_agaci 
GROUP BY ana_urun_id 
ORDER BY ana_urun_id;

-- 9. Malzeme ID'leri ve isimleri
SELECT DISTINCT
    malzeme_id,
    malzeme_adi,
    COUNT(*) as usage_count
FROM urun_agaci 
WHERE aktif = true
GROUP BY malzeme_id, malzeme_adi
ORDER BY usage_count DESC
LIMIT 20;

