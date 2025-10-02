-- BOM SORGUSU VERİTABANI TESTİ
-- Product ID 1241 için BOM sorgusu

-- 1. Product ID 1241'in aktif olup olmadığını kontrol et
SELECT 
    id,
    ad,
    kod,
    barkod,
    aktif,
    created_at
FROM nihai_urunler 
WHERE id = 1241;

-- 2. Product ID 1241 için BOM kayıtlarını kontrol et
SELECT 
    id,
    ana_urun_id,
    alt_urun_id,
    alt_urun_tipi,
    gerekli_miktar,
    birim,
    aktif,
    created_at
FROM urun_agaci 
WHERE ana_urun_id = 1241 
  AND ana_urun_tipi = 'nihai'
ORDER BY id;

-- 3. Aktif BOM kayıtlarını kontrol et
SELECT 
    id,
    ana_urun_id,
    alt_urun_id,
    alt_urun_tipi,
    gerekli_miktar,
    birim,
    aktif
FROM urun_agaci 
WHERE ana_urun_id = 1241 
  AND ana_urun_tipi = 'nihai'
  AND aktif = true
ORDER BY id;

-- 4. Tüm BOM kayıtlarını say
SELECT 
    COUNT(*) as total_bom_records,
    COUNT(CASE WHEN aktif = true THEN 1 END) as active_bom_records
FROM urun_agaci 
WHERE ana_urun_id = 1241 
  AND ana_urun_tipi = 'nihai';

-- 5. Product ID 186 için de kontrol et (log'larda görülen)
SELECT 
    id,
    ana_urun_id,
    alt_urun_id,
    alt_urun_tipi,
    gerekli_miktar,
    birim,
    aktif
FROM urun_agaci 
WHERE ana_urun_id = 186 
  AND ana_urun_tipi = 'nihai'
ORDER BY id;

